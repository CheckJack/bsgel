import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PUT - Update mega menu card
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const { imageUrl, linkUrl, isActive } = body;

    const card = await db.megaMenuCard.update({
      where: { id },
      data: {
        ...(imageUrl !== undefined && { imageUrl }),
        ...(linkUrl !== undefined && { linkUrl }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ card });
  } catch (error: any) {
    console.error("Failed to update mega menu card:", error);
    
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to update mega menu card",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete mega menu card
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const card = await db.megaMenuCard.findUnique({
      where: { id },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }

    // Delete image file if it exists in our uploads folder
    if (card.imageUrl && card.imageUrl.startsWith("/uploads/mega-menu-cards/")) {
      const filepath = join(process.cwd(), "public", card.imageUrl);
      if (existsSync(filepath)) {
        try {
          await unlink(filepath);
        } catch (err) {
          console.error("Failed to delete image file:", err);
        }
      }
    }

    // Delete from database
    await db.megaMenuCard.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete mega menu card:", error);
    
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to delete mega menu card" },
      { status: 500 }
    );
  }
}

