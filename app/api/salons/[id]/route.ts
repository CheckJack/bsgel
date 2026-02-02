import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === "ADMIN";

    console.log(`[Salon Detail API] Fetching salon with ID: ${id}, isAdmin: ${isAdmin}`);

    // Use select to match the list endpoint and avoid schema issues
    // Only select fields that definitely exist to avoid errors
    const selectFields: any = {
      id: true,
      name: true,
      address: true,
      city: true,
      postalCode: true,
      phone: true,
      email: true,
      website: true,
      latitude: true,
      longitude: true,
      image: true,
      logo: true,
      images: true,
      description: true,
      isActive: true,
      isBioDiamond: true,
      status: true,
      userId: true,
      workingHours: true,
      createdAt: true,
      updatedAt: true,
    };

    // Only include user relation for admins
    if (isAdmin) {
      selectFields.user = {
        select: {
          id: true,
          name: true,
          email: true,
        },
      };
    }

    const salon = await db.salon.findUnique({
      where: { id: id },
      select: selectFields,
    });

    if (!salon) {
      console.log(`[Salon Detail API] Salon not found with ID: ${id}`);
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    console.log(`[Salon Detail API] Found salon: ${salon.name}, isActive: ${salon.isActive}, status: ${salon.status}`);

    // For non-admin users, only show active and approved salons (exclude pending review)
    // This matches the filtering logic in the list endpoint
    if (!isAdmin) {
      if (!salon.isActive) {
        console.log(`[Salon Detail API] Salon ${salon.name} is not active, blocking access`);
        return NextResponse.json({ error: "Salon not found" }, { status: 404 });
      }
      if (salon.status === "PENDING_REVIEW") {
        console.log(`[Salon Detail API] Salon ${salon.name} is pending review, blocking access`);
        return NextResponse.json({ error: "Salon not found" }, { status: 404 });
      }
    }

    return NextResponse.json(salon);
  } catch (error: any) {
    console.error("[Salon Detail API] Failed to fetch salon:", error);
    console.error("[Salon Detail API] Error details:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    
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
        error: "Failed to fetch salon",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { name, address, city, postalCode, phone, email, website, latitude, longitude, image, logo, images, description, workingHours, isActive, isBioDiamond, changeReason, changes } = body;

    // Check if salon exists
    const existingSalon = await db.salon.findUnique({
      where: { id: id },
    });

    if (!existingSalon) {
      return NextResponse.json(
        { error: "Salon not found" },
        { status: 404 }
      );
    }

    // If user is logged in and not admin, verify they own this salon and are a professional
    if (session?.user?.id && session.user.role !== "ADMIN") {
      // Check if user is a professional (has certification)
      const hasCertification = !!session.user.certification;
      if (!hasCertification) {
        return NextResponse.json(
          { error: "Only professionals can manage salon listings. Please contact support to get certified." },
          { status: 403 }
        );
      }
      
      // Verify they own this salon
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
    if (email !== undefined) updateData.email = toNullIfEmpty(email);
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
    
    // Only admins can change isBioDiamond - regular users cannot modify this field
    const isAdmin = session?.user?.role === "ADMIN";
    if (isBioDiamond !== undefined) {
      if (isAdmin) {
        updateData.isBioDiamond = isBioDiamond;
      } else {
        // Non-admin users cannot change isBioDiamond - ignore the value
        // This prevents users from trying to set it via API calls
      }
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
      where: { id: id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // If admin made changes and salon has an owner, create notification
    if (session?.user?.role === "ADMIN" && salon.userId && (changeReason || (changes && changes.length > 0))) {
      try {
        const changesList = changes && Array.isArray(changes) ? changes : [];
        
        const notificationMessage = `Bio Sculpture Portugal requires you to make changes in your salon "${salon.name}". Click to view details.`;
        
        await db.notification.create({
          data: {
            type: "SYSTEM",
            title: "Salon Changes Required",
            message: notificationMessage,
            userId: salon.userId,
            linkUrl: "/dashboard/salon",
            metadata: {
              salonId: id,
              salonName: salon.name,
              updatedBy: session.user.id,
              changes: changesList,
              reason: changeReason || null,
            },
          },
        });
      } catch (notificationError) {
        console.error("Failed to create update notification:", notificationError);
        // Don't fail the update if notification fails
      }
    }

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
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body for deletion reason (only admins can provide reason)
    let deleteReason = "";
    if (session.user.role === "ADMIN") {
      try {
        const body = await req.json().catch(() => ({}));
        deleteReason = body.reason || "";
      } catch (e) {
        // Body might be empty, that's okay
      }
    }

    // Check if salon exists and get owner info
    const existingSalon = await db.salon.findUnique({
      where: { id: id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
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

    // Delete the salon
    await db.salon.delete({
      where: { id: id },
    });

    // If admin deleted with a reason and salon has an owner, create notification
    if (session.user.role === "ADMIN" && deleteReason && existingSalon.userId) {
      try {
        const notificationMessage = `Bio Sculpture Portugal has deleted your salon "${existingSalon.name}". The reason was: ${deleteReason}`;
        
        await db.notification.create({
          data: {
            type: "SYSTEM",
            title: "Salon Deleted",
            message: notificationMessage,
            userId: existingSalon.userId,
            linkUrl: "/dashboard/salon",
            metadata: {
              salonId: id,
              salonName: existingSalon.name,
              deletedBy: session.user.id,
              reason: deleteReason,
            },
          },
        });
      } catch (notificationError) {
        console.error("Failed to create deletion notification:", notificationError);
        // Don't fail the deletion if notification fails
      }
    }

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

