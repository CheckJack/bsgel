import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireAdminAi } from "@/lib/admin-ai/auth";
import { ADMIN_AI_MAX_IMAGE_BYTES, ADMIN_AI_MAX_PDF_BYTES } from "@/lib/admin-ai/config";
import { extractPdfText, truncateContext } from "@/lib/admin-ai/pdf";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { error, session } = await requireAdminAi();
    if (error) return error;

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (e) {
      console.error("[admin-ai/upload] formData failed:", e);
      return NextResponse.json(
        { error: "Could not read uploaded file. Try again or use a smaller PDF." },
        { status: 400 }
      );
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const mime = file.type || "";
    const isPdf = mime === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = mime.startsWith("image/");

    if (!isPdf && !isImage) {
      return NextResponse.json(
        { error: "Only PDF and image files are supported" },
        { status: 400 }
      );
    }

    const maxSize = isPdf ? ADMIN_AI_MAX_PDF_BYTES : ADMIN_AI_MAX_IMAGE_BYTES;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max ${Math.round(maxSize / 1024 / 1024)}MB` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), "uploads", "admin-ai", session!.user.id);
    await mkdir(uploadDir, { recursive: true });
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(uploadDir, safeName);
    await writeFile(filePath, buffer);

    let extractedText = "";
    let extractError: string | undefined;
    if (isPdf) {
      try {
        extractedText = truncateContext(await extractPdfText(buffer));
        if (!extractedText) {
          extractError =
            "PDF uploaded but no readable text was found. Export as text PDF or upload a screenshot.";
        }
      } catch (e) {
        console.error("[admin-ai/upload] PDF extract failed:", e);
        extractError =
          e instanceof Error
            ? `PDF text extraction failed: ${e.message}`
            : "PDF text extraction failed.";
      }
    }

    if (isPdf && !extractedText) {
      return NextResponse.json(
        {
          error: extractError || "Could not extract text from PDF.",
          fileName: file.name,
          mimeType: mime,
          size: file.size,
          storedPath: safeName,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      fileName: file.name,
      mimeType: mime,
      size: file.size,
      storedPath: safeName,
      extractedText: extractedText || undefined,
      imageBase64: isImage ? buffer.toString("base64") : undefined,
      hint: isPdf
        ? "PDF text extracted. Ask the assistant to analyze supplier order quantities and update stock."
        : "Image uploaded. Describe what you want analyzed.",
    });
  } catch (e) {
    console.error("[admin-ai/upload] unexpected error:", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? `Upload failed: ${e.message}`
            : "Upload failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
