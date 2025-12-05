import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const salon = await db.salon.findUnique({
      where: { id: params.id },
    });

    if (!salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    return NextResponse.json(salon);
  } catch (error) {
    console.error("Failed to fetch salon:", error);
    return NextResponse.json(
      { error: "Failed to fetch salon" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { name, address, city, postalCode, phone, email, website, latitude, longitude, image, logo, images, description, workingHours, isActive, isBioDiamond } = body;

    // Check if salon exists
    const existingSalon = await db.salon.findUnique({
      where: { id: params.id },
    });

    if (!existingSalon) {
      return NextResponse.json(
        { error: "Salon not found" },
        { status: 404 }
      );
    }

    // If user is logged in and not admin, verify they own this salon
    if (session?.user?.id && session.user.role !== "ADMIN") {
      if (existingSalon.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Unauthorized - You can only edit your own salon" },
          { status: 403 }
        );
      }
    }

    // Helper function to convert empty strings to null
    const toNullIfEmpty = (value: any) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }
      return value;
    };

    // Build update data object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (postalCode !== undefined) updateData.postalCode = toNullIfEmpty(postalCode);
    if (phone !== undefined) updateData.phone = toNullIfEmpty(phone);
    // For non-admin users, always use their account email (don't allow changing it)
    // For admins, allow changing the email
    if (session?.user?.id && session.user.role !== "ADMIN") {
      updateData.email = session.user.email;
    } else if (email !== undefined) {
      updateData.email = toNullIfEmpty(email);
    }
    if (website !== undefined) updateData.website = toNullIfEmpty(website);
    if (latitude !== undefined) {
      updateData.latitude = latitude !== null && latitude !== undefined && latitude !== "" ? parseFloat(latitude) : null;
    }
    if (longitude !== undefined) {
      updateData.longitude = longitude !== null && longitude !== undefined && longitude !== "" ? parseFloat(longitude) : null;
    }
    if (image !== undefined) updateData.image = toNullIfEmpty(image);
    if (logo !== undefined) updateData.logo = toNullIfEmpty(logo);
    if (images !== undefined) updateData.images = Array.isArray(images) ? images : [];
    if (description !== undefined) updateData.description = toNullIfEmpty(description);
    if (workingHours !== undefined) updateData.workingHours = workingHours || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // Only include isBioDiamond if it's provided (and handle if field doesn't exist yet)
    if (isBioDiamond !== undefined) {
      updateData.isBioDiamond = isBioDiamond;
    }

    // If user is logged in and updating from client panel, ensure userId is set
    if (session?.user?.id && session.user.role !== "ADMIN" && !existingSalon.userId) {
      updateData.userId = session.user.id;
    }

    // If a non-admin user is updating their salon and it was previously rejected,
    // reset status to PENDING_REVIEW for re-review
    if (session?.user?.id && session.user.role !== "ADMIN" && existingSalon.status === "REJECTED") {
      updateData.status = "PENDING_REVIEW";
      updateData.rejectionReason = null;
      updateData.reviewedBy = null;
      updateData.reviewedAt = null;
    }

    const salon = await db.salon.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(salon);
  } catch (error: any) {
    console.error("Failed to update salon:", error);
    
    // Check if it's a database connection error
    if (error?.code === "P1001") {
      return NextResponse.json(
        { 
          error: "Database connection error. Please check your DATABASE_URL in .env.local",
          details: error?.message,
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to update salon",
        details: error?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if salon exists
    const existingSalon = await db.salon.findUnique({
      where: { id: params.id },
    });

    if (!existingSalon) {
      return NextResponse.json(
        { error: "Salon not found" },
        { status: 404 }
      );
    }

    // If user is not admin, verify they own this salon
    if (session.user.role !== "ADMIN") {
      if (existingSalon.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Unauthorized - You can only delete your own salon" },
          { status: 403 }
        );
      }
    }

    await db.salon.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Salon deleted successfully" });
  } catch (error: any) {
    console.error("Failed to delete salon:", error);
    
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Salon not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to delete salon" },
      { status: 500 }
    );
  }
}

