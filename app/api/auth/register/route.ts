import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { db } from "@/lib/db"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1, "Name is required"),
  userType: z.enum(["customer", "professional"]).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  // Base64 encoding increases size by ~33%, so 15MB allows for ~10MB original file
  // Allow null or undefined for certificate (when customer type or no certificate uploaded)
  certificate: z.string().max(15 * 1024 * 1024, "Certificate file is too large (max 10MB original file)").nullable().optional(),
  certificationId: z.string().nullable().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, name, userType, role, certificate, certificationId } = registerSchema.parse(body)

    // Normalize email for checking
    const normalizedEmail = email.trim().toLowerCase()

    // Check if email is banned
    const bannedEmail = await db.bannedEmail.findUnique({
      where: { email: normalizedEmail },
    })

    if (bannedEmail) {
      return NextResponse.json(
        { error: "This email address is not allowed to create an account. Please contact support if you believe this is an error." },
        { status: 403 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Validate certificationId if provided
    let finalCertificationId: string | null = certificationId || null
    if (finalCertificationId) {
      const cert = await db.certification.findUnique({
        where: { id: finalCertificationId },
      })
      if (!cert) {
        return NextResponse.json(
          { error: "Invalid certification ID" },
          { status: 400 }
        )
      }
      if (!cert.isActive) {
        return NextResponse.json(
          { error: "Cannot assign inactive certification" },
          { status: 400 }
        )
      }
    }

    // Create user
    const createData: any = {
      email: normalizedEmail,
      password: hashedPassword,
      name: name.trim(),
      role: role || "USER", // Set role to ADMIN if provided, otherwise default to USER
      certificateUrl: certificate || null,
    }

    if (finalCertificationId) {
      createData.certification = { connect: { id: finalCertificationId } }
    }

    const user = await db.user.create({
      data: createData,
    })

    // Create cart for user (only for non-admin users)
    // Wrap in try-catch so cart creation failure doesn't break registration
    if (role !== "ADMIN") {
      try {
        await db.cart.create({
          data: {
            userId: user.id,
          },
        })
      } catch (cartError) {
        // Log cart error but don't fail the registration (cart can be created later)
        console.error("Failed to create cart:", cartError)
      }
    }

    // Create notification for admin users when a new customer signs up
    // Wrap in try-catch so notification failure doesn't break registration
    // Skip notifications for admin users
    try {
      if (role !== "ADMIN" && (userType === "customer" || !userType)) {
        const notification = await db.notification.create({
          data: {
            type: "NEW_CUSTOMER",
            title: "New Customer Signup",
            message: `${name.trim()} (${normalizedEmail}) has signed up as a new customer`,
            metadata: {
              userId: user.id,
              email: normalizedEmail,
              name: name.trim(),
            },
          },
        })
        console.log("✅ Notification created successfully:", notification.id)
      }

      // Create notification for admin users when a professional customer signs up
      if (role !== "ADMIN" && userType === "professional") {
        if (certificate) {
          // Professional with certificate - needs review
          const notification = await db.notification.create({
            data: {
              type: "NEW_PROFESSIONAL_CERTIFICATION",
              title: "New Professional Certification Upload",
              message: `${name.trim()} (${normalizedEmail}) has signed up as a professional and uploaded a certificate for review`,
              metadata: {
                userId: user.id,
                email: normalizedEmail,
                name: name.trim(),
                hasCertificate: true,
              },
            },
          })
          console.log("✅ Professional certification notification created successfully:", notification.id)
        } else {
          // Professional without certificate - still notify admin
          const notification = await db.notification.create({
            data: {
              type: "NEW_PROFESSIONAL_CERTIFICATION",
              title: "New Professional Signup",
              message: `${name.trim()} (${normalizedEmail}) has signed up as a professional (no certificate uploaded yet)`,
              metadata: {
                userId: user.id,
                email: normalizedEmail,
                name: name.trim(),
                hasCertificate: false,
              },
            },
          })
          console.log("✅ Professional signup notification created successfully:", notification.id)
        }
      }
    } catch (notificationError) {
      // Log notification error but don't fail the registration
      console.error("❌ Failed to create notification:", notificationError)
      if (notificationError instanceof Error) {
        console.error("Error message:", notificationError.message)
        console.error("Error stack:", notificationError.stack)
      }
    }

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Registration error:", error)
    
    // Provide more detailed error message for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: errorMessage,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}

