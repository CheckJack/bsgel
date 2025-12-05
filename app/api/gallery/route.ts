import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir, stat, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Configure route for file uploads
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "gallery");

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// GET - List gallery items
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user?.role === "ADMIN";
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId") || null;
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type"); // "FILE" or "FOLDER"
    const sortBy = searchParams.get("sortBy") || "name";

    const where: any = {};

    // For non-admin users, only show files (not folders) and ignore folder structure
    if (!isAdmin) {
      where.type = "FILE";
      // Don't filter by folderId for customers - show all files
    } else {
      // Admins can filter by folder
      where.folderId = folderId || null;
      if (type) {
        where.type = type;
      }
    }

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    const orderBy: any = {};
    switch (sortBy) {
      case "name":
        orderBy.name = "asc";
        break;
      case "date":
        orderBy.createdAt = "desc";
        break;
      case "size":
        orderBy.size = "desc";
        break;
      case "type":
        orderBy.type = "asc";
        break;
      default:
        orderBy.name = "asc";
    }

    const items = await db.galleryItem.findMany({
      where,
      orderBy,
      include: {
        items: {
          select: {
            id: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("Failed to fetch gallery items:", error);
    
    // Check if GalleryItem model doesn't exist (migration not run)
    if (error?.code === "P2021" || error?.message?.includes("does not exist") || error?.message?.includes("Unknown model")) {
      return NextResponse.json([]);
    }
    
    return NextResponse.json(
      { 
        error: "Failed to fetch gallery items",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

// POST - Create folder or upload file
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const action = formData.get("action") as string;

    if (action === "createFolder") {
      const name = formData.get("name") as string;
      const folderId = formData.get("folderId") as string | null;
      const description = formData.get("description") as string | null;

      if (!name) {
        return NextResponse.json(
          { error: "Folder name is required" },
          { status: 400 }
        );
      }

      // Check if folder with same name exists in same parent
      const existing = await db.galleryItem.findFirst({
        where: {
          name,
          type: "FOLDER",
          folderId: folderId || null,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "A folder with this name already exists" },
          { status: 400 }
        );
      }

      let folder;
      try {
        folder = await db.galleryItem.create({
          data: {
            name,
            type: "FOLDER",
            folderId: folderId || null,
            description: description || null,
          },
        });
      } catch (dbError: any) {
        // Check if GalleryItem model doesn't exist
        if (dbError?.code === "P2021" || dbError?.message?.includes("does not exist") || dbError?.message?.includes("Unknown model")) {
          return NextResponse.json(
            { error: "Gallery model not found. Please run: npx prisma migrate dev --name add_gallery" },
            { status: 500 }
          );
        }
        throw dbError;
      }

      return NextResponse.json(folder, { status: 201 });
    } else if (action === "upload") {
      const file = formData.get("file") as File;
      const folderId = formData.get("folderId") as string | null;
      const description = formData.get("description") as string | null;

      if (!file) {
        return NextResponse.json(
          { error: "No file provided" },
          { status: 400 }
        );
      }

      await ensureUploadDir();

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `${timestamp}_${sanitizedName}`;
      const filepath = join(UPLOAD_DIR, filename);

      // Save file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      try {
        await writeFile(filepath, buffer);
      } catch (writeError: any) {
        console.error("Failed to write file:", writeError);
        return NextResponse.json(
          { 
            error: "Failed to save file",
            details: writeError?.message || String(writeError)
          },
          { status: 500 }
        );
      }

      // Get file stats
      let fileSize = buffer.length;
      try {
        const stats = await stat(filepath);
        fileSize = stats.size;
      } catch (statError) {
        console.warn("Could not get file stats, using buffer size:", statError);
      }

      // Create database record
      let galleryItem;
      try {
        galleryItem = await db.galleryItem.create({
          data: {
            name: file.name,
            type: "FILE",
            url: `/uploads/gallery/${filename}`,
            mimeType: file.type || "application/octet-stream",
            size: fileSize,
            folderId: folderId || null,
            description: description || null,
          },
        });
      } catch (dbError: any) {
        // If database insert fails, try to clean up the file
        try {
          if (existsSync(filepath)) {
            await unlink(filepath);
          }
        } catch (cleanupError) {
          console.error("Failed to cleanup file after DB error:", cleanupError);
        }
        
        // Check if GalleryItem model doesn't exist
        if (dbError?.code === "P2021" || dbError?.message?.includes("does not exist") || dbError?.message?.includes("Unknown model")) {
          return NextResponse.json(
            { error: "Gallery model not found. Please run: npx prisma migrate dev --name add_gallery" },
            { status: 500 }
          );
        }
        
        throw dbError;
      }

      return NextResponse.json(galleryItem, { status: 201 });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Failed to create gallery item:", error);
    
    // Check if GalleryItem model doesn't exist (migration not run)
    if (error?.code === "P2021" || error?.message?.includes("does not exist") || error?.message?.includes("Unknown model")) {
      return NextResponse.json(
        { error: "Gallery model not found. Please run: npx prisma migrate dev --name add_gallery" },
        { status: 500 }
      );
    }
    
    // Return detailed error message for debugging
    return NextResponse.json(
      { 
        error: "Failed to create gallery item",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete gallery item
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    const item = await db.galleryItem.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // If it's a folder with items, don't delete
    if (item.type === "FOLDER" && item.items.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete folder with items. Please empty it first." },
        { status: 400 }
      );
    }

    // Delete file from filesystem if it's a file
    if (item.type === "FILE" && item.url) {
      const filepath = join(process.cwd(), "public", item.url);
      if (existsSync(filepath)) {
        try {
          await unlink(filepath);
        } catch (err) {
          console.error("Failed to delete file:", err);
        }
      }
    }

    // Delete from database
    await db.galleryItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete gallery item:", error);
    return NextResponse.json(
      { error: "Failed to delete gallery item" },
      { status: 500 }
    );
  }
}

