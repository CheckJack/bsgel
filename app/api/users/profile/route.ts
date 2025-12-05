import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { hash, compare } from "bcryptjs";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        shippingAddress: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

const updateProfileSchema = z.object({
  name: z.string().nullable().optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string().min(6, "Password must be at least 6 characters").optional()
  ),
  image: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  shippingAddress: z.string().nullable().optional(),
}).refine(
  (data) => {
    // If newPassword is provided and not empty, currentPassword must also be provided
    if (data.newPassword && data.newPassword.trim() !== "" && !data.currentPassword) {
      return false;
    }
    return true;
  },
  {
    message: "Current password is required to change password",
    path: ["currentPassword"],
  }
);

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Filter out undefined values to avoid schema issues
    const filteredBody = Object.fromEntries(
      Object.entries(body).filter(([_, value]) => value !== undefined)
    );
    
    const validatedData = updateProfileSchema.parse(filteredBody);

    // Get current user
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: {
      name?: string;
      email?: string;
      password?: string;
      image?: string | null;
      shippingAddress?: string | null;
    } = {};

    // Update name if provided
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name === "" ? null : validatedData.name;
    }

    // Update email if provided
    if (validatedData.email !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await db.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: "Email is already taken" },
          { status: 400 }
        );
      }

      updateData.email = validatedData.email;
    }

    // Update password if provided
    if (validatedData.newPassword && validatedData.newPassword.trim() !== "") {
      if (!validatedData.currentPassword || validatedData.currentPassword.trim() === "") {
        return NextResponse.json(
          { error: "Current password is required to change password" },
          { status: 400 }
        );
      }

      // Verify current password
      const isPasswordValid = await compare(
        validatedData.currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      // Hash new password
      updateData.password = await hash(validatedData.newPassword, 10);
    }

    // Update image if provided
    if (validatedData.image !== undefined) {
      updateData.image = validatedData.image === "" || validatedData.image === null ? null : validatedData.image;
    }

    // Update shipping address if provided
    if (validatedData.shippingAddress !== undefined) {
      updateData.shippingAddress = validatedData.shippingAddress === "" || validatedData.shippingAddress === null ? null : validatedData.shippingAddress;
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        shippingAddress: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return NextResponse.json(
        { 
          error: "Invalid input", 
          details: error.errors.map(err => ({
            field: err.path.join("."),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    // Handle Prisma errors
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Email is already taken" },
          { status: 400 }
        );
      }
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
    }

    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { 
        error: "Failed to update profile",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

