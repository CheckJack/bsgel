import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Configure route for file uploads
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "mega-menu-cards");

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// GET - List mega menu cards
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const menuType = searchParams.get("menuType"); // "SHOP" or "ABOUT"
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: any = {};
    
    if (menuType) {
      where.menuType = menuType;
    }
    
    if (!includeInactive) {
      where.isActive = true;
    }

    const cards = await db.megaMenuCard.findMany({
      where,
      orderBy: [
        { menuType: "asc" },
        { position: "asc" }
      ],
    });

    return NextResponse.json({ cards });
  } catch (error: any) {
    console.error("Failed to fetch mega menu cards:", error);
    
    // Check if model doesn't exist (migration not run)
    if (error?.code === "P2021" || error?.message?.includes("does not exist") || error?.message?.includes("Unknown model")) {
      return NextResponse.json({ cards: [] });
    }
    
    return NextResponse.json(
      { 
        error: "Failed to fetch mega menu cards",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

// POST - Create or update mega menu card
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const menuType = formData.get("menuType") as string;
    const positionStr = formData.get("position") as string;
    const position = positionStr ? parseInt(positionStr, 10) : NaN;
    const linkUrl = formData.get("linkUrl") as string;
    const isActive = formData.get("isActive") === "true";
    const file = formData.get("file") as File | null;
    const existingImageUrl = formData.get("existingImageUrl") as string | null;

    console.log("Mega Menu Card Update Request:", {
      menuType,
      position,
      positionStr,
      linkUrl,
      isActive,
      hasFile: !!file,
      existingImageUrl,
    });

    if (!menuType || isNaN(position) || !linkUrl) {
      return NextResponse.json(
        { 
          error: "menuType, position, and linkUrl are required",
          received: { menuType, position, linkUrl }
        },
        { status: 400 }
      );
    }

    if (!["SHOP", "ABOUT"].includes(menuType)) {
      return NextResponse.json(
        { error: "menuType must be SHOP or ABOUT" },
        { status: 400 }
      );
    }

    if (position < 1 || position > 2) {
      return NextResponse.json(
        { error: "position must be 1 or 2", received: position },
        { status: 400 }
      );
    }

    let imageUrl = existingImageUrl || "";

    // Upload new image if provided
    if (file) {
      await ensureUploadDir();

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `${timestamp}_${sanitizedName}`;
      const filepath = join(UPLOAD_DIR, filename);

      // Save file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      imageUrl = `/uploads/mega-menu-cards/${filename}`;
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image is required" },
        { status: 400 }
      );
    }

    // Use upsert to create or update
    console.log("Attempting upsert with:", {
      menuType,
      position,
      imageUrl,
      linkUrl,
      isActive,
    });

    let card;
    try {
      // Try to find existing card first
      const existingCard = await db.megaMenuCard.findFirst({
        where: {
          menuType: menuType as "SHOP" | "ABOUT",
          position: position,
        },
      });

      if (existingCard) {
        // Update existing card
        card = await db.megaMenuCard.update({
          where: {
            id: existingCard.id,
          },
          data: {
            imageUrl,
            linkUrl,
            isActive,
          },
        });
        console.log("Successfully updated card:", card.id);
      } else {
        // Create new card
        card = await db.megaMenuCard.create({
          data: {
            menuType: menuType as "SHOP" | "ABOUT",
            position: position,
            imageUrl,
            linkUrl,
            isActive,
          },
        });
        console.log("Successfully created card:", card.id);
      }
    } catch (upsertError: any) {
      // Fallback to upsert if findFirst/update/create fails
      console.log("Fallback to upsert method");
      card = await db.megaMenuCard.upsert({
        where: {
          menuType_position: {
            menuType: menuType as "SHOP" | "ABOUT",
            position: position,
          },
        },
        update: {
          imageUrl,
          linkUrl,
          isActive,
        },
        create: {
          menuType: menuType as "SHOP" | "ABOUT",
          position: position,
          imageUrl,
          linkUrl,
          isActive,
        },
      });
      console.log("Successfully upserted card:", card.id);
    }

    return NextResponse.json({ card }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create/update mega menu card:", error);
    console.error("Error details:", {
      code: error?.code,
      message: error?.message,
      meta: error?.meta,
      stack: error?.stack,
    });
    
    // Check if model doesn't exist
    if (error?.code === "P2021" || error?.message?.includes("does not exist") || error?.message?.includes("Unknown model")) {
      return NextResponse.json(
        { error: "MegaMenuCard model not found. Please run database migrations." },
        { status: 500 }
      );
    }
    
    // Check for Prisma unique constraint errors
    if (error?.code === "P2002") {
      return NextResponse.json(
        { 
          error: "A card with this menuType and position already exists",
          details: error?.meta?.target,
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create/update mega menu card",
        details: error?.message || String(error),
        code: error?.code,
        meta: error?.meta,
      },
      { status: 500 }
    );
  }
}

