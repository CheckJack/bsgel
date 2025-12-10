import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Fetch the original blog
    const originalBlog = await db.blog.findUnique({
      where: { id: params.id },
    });

    if (!originalBlog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    // Generate a unique slug
    let newSlug = `copy-of-${originalBlog.slug}`;
    let slugCounter = 1;
    
    while (true) {
      const existingBlog = await db.blog.findUnique({
        where: { slug: newSlug },
      });

      if (!existingBlog) {
        break;
      }

      newSlug = `copy-of-${originalBlog.slug}-${slugCounter}`;
      slugCounter++;
    }

    // Create a duplicate with "Copy of" prefix
    const duplicatedBlog = await db.blog.create({
      data: {
        title: `Copy of ${originalBlog.title}`,
        slug: newSlug,
        excerpt: originalBlog.excerpt,
        content: originalBlog.content,
        image: originalBlog.image,
        author: originalBlog.author,
        status: "DRAFT", // Always duplicate as draft
        publishedAt: null, // Reset published date
      },
    });

    return NextResponse.json(duplicatedBlog, { status: 201 });
  } catch (error: any) {
    console.error("Failed to duplicate blog:", error);
    
    // Check for duplicate slug
    if (error.code === "P2002" && error.meta?.target?.includes("slug")) {
      return NextResponse.json(
        { error: "A blog with this slug already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to duplicate blog",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

