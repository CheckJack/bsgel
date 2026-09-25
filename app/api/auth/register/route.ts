import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { createReferral, getOrCreateAffiliate } from "@/lib/affiliate"
import { calculatePoints, awardPoints } from "@/lib/points"
import { checkAndNotifyMilestones } from "@/lib/notifications/affiliate-milestones"
import { autoPromoteAffiliate } from "@/lib/affiliate-tiers"
import { createAndStoreVerificationCode } from "@/lib/email/verification"
import { sendEmailVerificationCode } from "@/lib/email/auth-emails"
import { withNotificationI18n } from "@/lib/notifications/i18n"
import {
  AUTH_RATE_LIMITS,
  clientIpFromRequest,
  rateLimit,
  tooManyRequestsResponse,
} from "@/lib/rate-limit"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1, "Name is required"),
  // Required for customer/professional signup; optional when an admin creates a staff user
  phone: z.string().optional().nullable(),
  marketingConsent: z.boolean().optional(),
  userType: z.enum(["customer", "professional"]).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  permissions: z.record(z.enum(["allow", "deny"])).optional(),
  // Base64 encoding increases size by ~33%, so 15MB allows for ~10MB original file
  // Allow null or undefined for certificate (when customer type or no certificate uploaded)
  certificate: z.string().max(15 * 1024 * 1024, "Certificate file is too large (max 10MB original file)").nullable().optional(),
  certificationId: z.string().nullable().optional(),
  referralCode: z.string().nullable().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      email,
      password,
      name,
      phone,
      marketingConsent,
      userType,
      role: requestedRole,
      permissions,
      certificate,
      certificationId,
      referralCode,
    } = registerSchema.parse(body)

    // Only an authenticated ADMIN may create ADMIN accounts.
    // Public signup (customers / professionals) is always USER — never trust client role.
    let effectiveRole: "USER" | "ADMIN" = "USER"
    let effectivePermissions: Record<string, "allow" | "deny"> | null = null

    if (requestedRole === "ADMIN") {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id || session.user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Unauthorized — only admins can create admin accounts" },
          { status: 403 }
        )
      }
      effectiveRole = "ADMIN"
      effectivePermissions = permissions || null
    } else {
      // Rate-limit public signups (admins creating staff accounts are exempt)
      const ip = clientIpFromRequest(req)
      const limited = rateLimit({
        key: `auth:register:ip:${ip}`,
        ...AUTH_RATE_LIMITS.registerIp,
      })
      if (!limited.ok) {
        return tooManyRequestsResponse(limited)
      }
    }

    if (effectiveRole === "USER" && !phone?.trim()) {
      return NextResponse.json(
        { error: "Phone is required" },
        { status: 400 }
      )
    }

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

    // Validate certificationId if provided (professional signup — unchanged)
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
      if (cert.isSystem) {
        return NextResponse.json(
          { error: "Cannot assign a system certification to users" },
          { status: 400 }
        )
      }
    }

    // Create user
    const createData: any = {
      email: normalizedEmail,
      password: hashedPassword,
      name: name.trim(),
      phone: phone?.trim() || null,
      marketingConsent: !!marketingConsent,
      role: effectiveRole,
      permissions: effectivePermissions,
      isActive: true,
      // If professional, set certificateUrl to the uploaded certificate or a placeholder
      // to indicate it's pending review. Only NULL means approved.
      certificateUrl: certificate || (userType === "professional" ? "PENDING_REVIEW" : null),
    }

    // Set certificationId but DON'T connect the certification relation
    // The relation will be connected only when admin approves the certification
    if (finalCertificationId) {
      createData.certificationId = finalCertificationId
    }

    const user = await db.user.create({
      data: createData,
    })

    // Create cart for user (only for non-admin users)
    if (effectiveRole !== "ADMIN") {
      try {
        await db.cart.create({
          data: {
            userId: user.id,
          },
        })
      } catch (cartError) {
        console.error("Failed to create cart:", cartError)
      }

      try {
        await getOrCreateAffiliate(user.id, normalizedEmail)
        console.log(`✅ Affiliate record created for user: ${normalizedEmail}`)
      } catch (affiliateError) {
        console.error("Failed to create affiliate record:", affiliateError)
      }
    }

    // Handle referral code from registration payload
    try {
      if (referralCode) {
        const referringAffiliate = await db.affiliate.findUnique({
          where: { affiliateCode: referralCode },
        })

        if (referringAffiliate && referringAffiliate.isActive) {
          if (referringAffiliate.userId === user.id) {
            console.warn(`⚠️ Self-referral attempt blocked for user ${user.email} with code ${referralCode}`)
          } else {
            await db.affiliateLinkClick.updateMany({
              where: {
                affiliateId: referringAffiliate.id,
                converted: false,
                clickedAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
              },
              data: {
                converted: true,
                convertedAt: new Date(),
                convertedUserId: user.id,
              },
            })

            const referral = await createReferral(referringAffiliate.id, user.id)

            const points = await calculatePoints("REFERRAL_SIGNUP")
            if (points > 0) {
              await awardPoints(
                referringAffiliate.userId,
                points,
                "AFFILIATE_REFERRAL",
                referral.id,
                `Referral signup: ${user.email}`
              )

              await checkAndNotifyMilestones(referringAffiliate.userId, referringAffiliate.id)
              await autoPromoteAffiliate(referringAffiliate.id)
            }
          }
        }
      }
    } catch (referralError) {
      console.error("Failed to process referral:", referralError)
    }

    // Notifications for new customers / professionals (not for staff admins)
    try {
      if (effectiveRole !== "ADMIN" && (userType === "customer" || !userType)) {
        const notification = await db.notification.create({
          data: {
            type: "NEW_CUSTOMER",
            title: "New Customer Signup",
            message: `${name.trim()} (${normalizedEmail}) has signed up as a new customer`,
            linkUrl: `/admin/customers?userId=${user.id}`,
            metadata: withNotificationI18n(
              {
                userId: user.id,
                email: normalizedEmail,
                name: name.trim(),
              },
              {
                titleKey: "inApp.newCustomerTitle",
                messageKey: "inApp.newCustomerMessage",
                params: { name: name.trim(), email: normalizedEmail },
              }
            ),
          },
        })
        console.log("✅ Notification created successfully:", notification.id)
      }

      if (effectiveRole !== "ADMIN" && userType === "professional") {
        const adminUsers = await db.user.findMany({
          where: { role: "ADMIN" },
          select: { id: true },
        })

        const notificationData = {
          type: "NEW_PROFESSIONAL_CERTIFICATION" as const,
          title: "New Professional Certification Pending Review",
          message: certificate
            ? `${name.trim()} (${normalizedEmail}) has signed up as a professional and uploaded a certificate for review`
            : `${name.trim()} (${normalizedEmail}) has signed up as a professional (no certificate uploaded yet)`,
          linkUrl: `/admin/customers?userId=${user.id}`,
          metadata: withNotificationI18n(
            {
              userId: user.id,
              email: normalizedEmail,
              name: name.trim(),
              customerName: name.trim(),
              hasCertificate: !!certificate,
              certificationId: finalCertificationId,
            },
            {
              titleKey: "inApp.newCertificationTitle",
              messageKey: "inApp.newCertificationMessage",
              params: { name: name.trim() },
            }
          ),
        }

        if (adminUsers.length > 0) {
          await Promise.all(
            adminUsers.map((admin) =>
              db.notification.create({
                data: {
                  ...notificationData,
                  userId: admin.id,
                },
              })
            )
          )
          console.log(`✅ Professional certification notifications created for ${adminUsers.length} admin(s)`)
        } else {
          await db.notification.create({
            data: notificationData,
          })
          console.log("✅ Professional certification notification created (no admins found)")
        }
      }
    } catch (notificationError) {
      console.error("❌ Failed to create notification:", notificationError)
      if (notificationError instanceof Error) {
        console.error("Error message:", notificationError.message)
        console.error("Error stack:", notificationError.stack)
      }
    }

    // Email verification — admins created by an admin are auto-verified
    if (effectiveRole === "ADMIN") {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      })
    } else {
      try {
        const code = await createAndStoreVerificationCode(user.id)
        let certificationName: string | null = null
        const pendingCertification =
          userType === "professional" && !!finalCertificationId

        if (pendingCertification && finalCertificationId) {
          const cert = await db.certification.findUnique({
            where: { id: finalCertificationId },
            select: { name: true },
          })
          certificationName = cert?.name || null
        }

        await sendEmailVerificationCode({
          to: normalizedEmail,
          name: name.trim(),
          code,
          pendingCertification,
          certificationName,
        })
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError)
      }
    }

    return NextResponse.json(
      {
        success: true,
        requiresEmailVerification: effectiveRole !== "ADMIN",
        email: normalizedEmail,
        message: "User created successfully",
        userId: user.id,
      },
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
