import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === "ADMIN";
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const city = searchParams.get("city") || "";

    // Build where clause for search
    const where: any = {};

    // For non-admin users, only show approved and active salons
    // For admins, show all salons
    if (!isAdmin) {
      where.isActive = true;
      where.status = "APPROVED";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" as const } },
        { address: { contains: search, mode: "insensitive" as const } },
        { city: { contains: search, mode: "insensitive" as const } },
      ];
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" as const };
    }

    // Fetch salons - include user info for admin, BIO Diamond salons first, then by city and name
    const salons = await db.salon.findMany({
      where,
      include: isAdmin ? {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      } : undefined,
      orderBy: [
        { isBioDiamond: "desc" },
        { city: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json(salons);
  } catch (error: any) {
    console.error("Failed to fetch salons:", error);
    
    // If it's a database schema error (table doesn't exist), return empty array
    if (error?.message?.includes("Unknown column") || error?.code === "P2021" || error?.code === "P2001") {
      return NextResponse.json([]);
    }
    
    return NextResponse.json(
      { error: "Failed to fetch salons" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { name, address, city, postalCode, phone, email, website, latitude, longitude, image, logo, images, description, workingHours, isBioDiamond } = body;

    // Validate required fields
    if (!name || !address || !city) {
      return NextResponse.json(
        { error: "Name, address, and city are required fields" },
        { status: 400 }
      );
    }

    // If user is logged in (from client panel), associate salon with user
    // If admin is creating (no session or admin), userId will be null
    const userId = session?.user?.id && session.user.role !== "ADMIN" ? session.user.id : null;
    const isAdmin = session?.user?.role === "ADMIN";

    // Check if user already has a salon (only for non-admin users)
    if (userId) {
      const existingSalon = await db.salon.findUnique({
        where: { userId },
      });
      if (existingSalon) {
        return NextResponse.json(
          { error: "You already have a salon listing. Please edit your existing salon instead." },
          { status: 400 }
        );
      }
    }

    // For non-admin users, use their account email instead of form input
    // For admins, use the email from the form
    const salonEmail = userId && session?.user?.email 
      ? session.user.email 
      : (email || null);

    // Set status: PENDING_REVIEW for client-created salons, APPROVED for admin-created salons
    const salonStatus = userId && !isAdmin ? "PENDING_REVIEW" : "APPROVED";

    // Helper function to convert empty strings to null and validate string types
    const toNullIfEmpty = (value: any) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }
      // Ensure it's a string type (not an object or array)
      if (typeof value !== "string") {
        console.warn("Non-string value received, converting to null:", typeof value, value);
        return null;
      }
      // Trim the string
      const trimmed = value.trim();
      if (trimmed === "") {
        return null;
      }
      return trimmed;
    };

    // Validate and sanitize logo/image base64 strings
    const sanitizeBase64 = (value: string | null | undefined): string | null => {
      if (!value || typeof value !== "string") return null;
      const trimmed = value.trim();
      if (trimmed === "") return null;
      // Ensure it's a valid base64 data URL or plain base64
      if (trimmed.startsWith("data:")) {
        // Validate data URL format: data:[<mediatype>][;base64],<data>
        const parts = trimmed.split(",");
        if (parts.length !== 2) {
          console.warn("Invalid data URL format, using as-is");
          return trimmed;
        }
        return trimmed;
      }
      // If it's plain base64, accept it
      return trimmed;
    };

    // Prepare salon data with validation
    const salonData: any = {
      name: String(name).trim(),
      address: String(address).trim(),
      city: String(city).trim(),
      postalCode: toNullIfEmpty(postalCode),
      phone: toNullIfEmpty(phone),
      email: toNullIfEmpty(salonEmail),
      website: toNullIfEmpty(website),
      latitude: latitude !== null && latitude !== undefined && latitude !== "" ? parseFloat(String(latitude)) : null,
      longitude: longitude !== null && longitude !== undefined && longitude !== "" ? parseFloat(String(longitude)) : null,
      image: sanitizeBase64(image),
      logo: sanitizeBase64(logo),
      images: Array.isArray(images) ? images.filter((img: any) => typeof img === "string" && img.trim() !== "").map((img: string) => sanitizeBase64(img)).filter((img: any) => img !== null) : [],
      description: toNullIfEmpty(description),
      workingHours: workingHours || null,
      isBioDiamond: isBioDiamond ?? false,
      status: salonStatus,
      userId: userId || null,
    };

    // Validate required fields
    if (!salonData.name || salonData.name.trim() === "") {
      return NextResponse.json(
        { error: "Salon name is required" },
        { status: 400 }
      );
    }
    if (!salonData.address || salonData.address.trim() === "") {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }
    if (!salonData.city || salonData.city.trim() === "") {
      return NextResponse.json(
        { error: "City is required" },
        { status: 400 }
      );
    }

    // Validate status enum value
    const validStatuses = ["PENDING_REVIEW", "APPROVED", "REJECTED"];
    if (!validStatuses.includes(salonData.status)) {
      console.error("Invalid status value:", salonData.status);
      return NextResponse.json(
        { error: `Invalid status value. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate and sanitize workingHours JSON
    if (salonData.workingHours !== null && salonData.workingHours !== undefined) {
      try {
        // If it's already an object, validate it
        if (typeof salonData.workingHours === "object") {
          // Ensure it's a plain object (not an array or other type)
          if (Array.isArray(salonData.workingHours)) {
            console.warn("workingHours is an array, converting to null");
            salonData.workingHours = null;
          } else {
            // Validate the structure - should be an object with day keys
            const workingHoursObj = salonData.workingHours as any;
            // Keep it as is if it's a valid object
            salonData.workingHours = workingHoursObj;
          }
        } else if (typeof salonData.workingHours === "string") {
          // Try to parse if it's a string
          try {
            salonData.workingHours = JSON.parse(salonData.workingHours);
          } catch (e) {
            console.warn("Failed to parse workingHours JSON string, setting to null");
            salonData.workingHours = null;
          }
        } else {
          console.warn("Invalid workingHours type, setting to null");
          salonData.workingHours = null;
        }
      } catch (e) {
        console.error("Error validating workingHours:", e);
        salonData.workingHours = null;
      }
    }

    // Log the data being sent (excluding potentially long base64 strings)
    console.log("=== CREATING SALON ===");
    console.log("Salon data summary:", {
      name: salonData.name,
      address: salonData.address,
      city: salonData.city,
      postalCode: salonData.postalCode,
      phone: salonData.phone,
      email: salonData.email,
      website: salonData.website,
      latitude: salonData.latitude,
      longitude: salonData.longitude,
      image: salonData.image ? `[${salonData.image.length} chars]` : null,
      logo: salonData.logo ? `[${salonData.logo.length} chars]` : null,
      images: salonData.images?.length || 0,
      description: salonData.description ? `[${salonData.description.length} chars]` : null,
      workingHours: salonData.workingHours ? JSON.stringify(salonData.workingHours).substring(0, 200) : null,
      isBioDiamond: salonData.isBioDiamond,
      status: salonData.status,
      userId: salonData.userId,
    });

    // Log field types for debugging
    console.log("Field types:", {
      name: typeof salonData.name,
      address: typeof salonData.address,
      city: typeof salonData.city,
      postalCode: typeof salonData.postalCode,
      phone: typeof salonData.phone,
      email: typeof salonData.email,
      website: typeof salonData.website,
      latitude: typeof salonData.latitude,
      longitude: typeof salonData.longitude,
      image: typeof salonData.image,
      logo: typeof salonData.logo,
      images: Array.isArray(salonData.images) ? "array" : typeof salonData.images,
      description: typeof salonData.description,
      workingHours: typeof salonData.workingHours,
      isBioDiamond: typeof salonData.isBioDiamond,
      status: typeof salonData.status,
      userId: typeof salonData.userId,
    });

    const salon = await db.salon.create({
      data: salonData,
    });

    return NextResponse.json(salon, { status: 201 });
  } catch (error: any) {
    // Safely extract error information
    const errorCode = error?.code || "UNKNOWN";
    const errorMessage = error?.message || String(error) || "Unknown error occurred";
    const errorMeta = error?.meta ? (typeof error?.meta === "object" ? JSON.stringify(error?.meta) : error?.meta) : null;
    
    console.error("========== SALON CREATION ERROR ==========");
    console.error("Error code:", errorCode);
    console.error("Error message:", errorMessage);
    console.error("Error meta:", errorMeta);
    console.error("Full error object:", error);
    console.error("Error stack:", error?.stack);
    console.error("==========================================");
    
    // Check if it's a database connection error
    if (errorCode === "P1001") {
      return NextResponse.json(
        { 
          error: "Database connection error. Please check your DATABASE_URL in .env.local",
          details: errorMessage,
        },
        { status: 500 }
      );
    }
    
    // Check if it's a value too long error (likely migration not run - VARCHAR instead of TEXT)
    if (errorCode === "P2000" || errorMessage?.toLowerCase().includes("value too long") || errorMessage?.toLowerCase().includes("character varying")) {
      return NextResponse.json(
        { 
          error: "Database schema needs to be updated. The image/logo fields need to be TEXT type to store base64 images. Please run: npx prisma migrate dev",
          details: errorMessage,
          code: errorCode,
          instructions: "Run 'npx prisma migrate dev --name update_salon_fields_to_text' to update your database schema. This will change the logo, image, and description fields from VARCHAR to TEXT to support large base64 strings. NEVER use 'db push' as it can delete all your data!",
        },
        { status: 500 }
      );
    }
    
    // Check if it's a schema mismatch error (migration not run)
    if (errorCode === "P2002" || errorMessage?.includes("Unknown column") || errorMessage?.includes("column") || errorCode === "P2021") {
      return NextResponse.json(
        { 
          error: "Database schema needs to be updated. Please run: npx prisma migrate dev",
          details: errorMessage,
          code: errorCode,
        },
        { status: 500 }
      );
    }
    
    // Check for Prisma validation errors
    if (errorMessage?.includes("Invalid `prisma.salon.create()`") || errorMessage?.includes("Argument") || errorCode === "P2009" || errorCode === "P2011" || errorCode === "P2012") {
      // Extract field name from error if possible - try multiple patterns
      let fieldName = "unknown";
      const patterns = [
        /Argument `(\w+)`/,
        /Unknown arg `(\w+)`/,
        /Field `(\w+)`/,
        /column "(\w+)"/i,
      ];
      
      for (const pattern of patterns) {
        const match = errorMessage?.match(pattern);
        if (match) {
          fieldName = match[1];
          break;
        }
      }
      
      return NextResponse.json(
        { 
          error: `Invalid data provided for field: ${fieldName}. Please check the field value and try again.`,
          details: errorMessage,
          code: errorCode,
          field: fieldName,
          hint: "This might be due to invalid data types, invalid enum values, or constraint violations.",
          fullErrorMessage: errorMessage, // Include full error for debugging
          errorMeta: errorMeta,
        },
        { status: 500 }
      );
    }
    
    // Return more specific error message with full details
    return NextResponse.json(
      { 
        error: errorMessage || "Failed to create salon. Please check the console for details.",
        details: errorMessage,
        code: errorCode,
        meta: errorMeta,
        fullError: errorMessage,
        hint: "Check the server terminal for detailed error logs. The error code and message above should help identify the issue.",
      },
      { status: 500 }
    );
  }
}

