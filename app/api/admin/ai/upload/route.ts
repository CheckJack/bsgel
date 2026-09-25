import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireAdminAi } from "@/lib/admin-ai/auth";
import { ADMIN_AI_MAX_IMAGE_BYTES, ADMIN_AI_MAX_PDF_BYTES } from "@/lib/admin-ai/config";
import { extractPdfText, truncateContext } from "@/lib/admin-ai/pdf";

export async function POST(req: Request) {
  const { error, session } = await requireAdminAi();
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const mime = file.type || "";
  const isPdf = mime === "application/pdf" || file.name.endsWith(".pdf");
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
  if (isPdf) {
    extractedText = truncateContext(await extractPdfText(buffer));
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
}
