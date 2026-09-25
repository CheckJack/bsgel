import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { db } from './db'
import { withNotificationI18n } from './notifications/i18n'
import {
  AUTH_RATE_LIMITS,
  rateLimit,
} from './rate-limit'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error("❌ Auth: Missing credentials")
            return null
          }

          // Normalize email to lowercase (same as registration)
          const normalizedEmail = credentials.email.trim().toLowerCase()
          console.log("🔐 Auth: Attempting login for:", normalizedEmail)

          // Per-email limit (IP limited in /api/auth/[...nextauth])
          const emailLimit = rateLimit({
            key: `auth:login:email:${normalizedEmail}`,
            ...AUTH_RATE_LIMITS.loginEmail,
          })
          if (!emailLimit.ok) {
            console.error("❌ Auth: Rate limited for email:", normalizedEmail)
            throw new Error("RATE_LIMITED")
          }

          // Use raw query to avoid schema mismatch issues with missing columns
          const users = await db.$queryRaw<Array<{
            id: string
            email: string
            password: string
            role: string
            name: string | null
            emailVerifiedAt: Date | null
            isActive: boolean
          }>>`
            SELECT id, email, password, role, name, "emailVerifiedAt", "isActive"
            FROM "User"
            WHERE LOWER(email) = ${normalizedEmail}
            LIMIT 1
          `

          if (!users || users.length === 0) {
            console.error("❌ Auth: User not found for email:", normalizedEmail)
            return null
          }

          const user = users[0]
          const userId = user.id
          const userEmail = user.email
          const userPassword = user.password
          const userRole = user.role
          const userName = user.name

          console.log("✅ Auth: User found:", userEmail, "Role:", userRole)

          const isPasswordValid = await compare(credentials.password, userPassword)

          if (!isPasswordValid) {
            console.error("❌ Auth: Invalid password for:", normalizedEmail)
            return null
          }

          console.log("✅ Auth: Password valid for:", normalizedEmail)

          // Block banned emails (even if the User row still exists)
          const banned = await db.bannedEmail.findUnique({
            where: { email: normalizedEmail },
            select: { id: true },
          })
          if (banned) {
            console.error("❌ Auth: Banned email attempted login:", normalizedEmail)
            throw new Error("ACCOUNT_BANNED")
          }

          // Block deactivated accounts
          if (user.isActive === false) {
            console.error("❌ Auth: Inactive account attempted login:", normalizedEmail)
            throw new Error("ACCOUNT_INACTIVE")
          }

          // Require email verification for non-admin users (existing users were grandfathered)
          if (userRole !== "ADMIN" && !user.emailVerifiedAt) {
            console.error("❌ Auth: Email not verified for:", normalizedEmail)
            throw new Error("EMAIL_NOT_VERIFIED")
          }

          // Get user details including lastLoginAt, certificationId, and certificateUrl
          let certificationName = null
          let userCertificationId = null
          let isFirstLogin = false
          let hasCertificate = false
          
          try {
            const userDetails = await db.$queryRaw<Array<{ 
              certificationId: string | null
              lastLoginAt: Date | null
              certificateUrl: string | null
            }>>`
              SELECT "certificationId", "lastLoginAt", "certificateUrl"
              FROM "User"
              WHERE id = ${userId}
              LIMIT 1
            `
            
            if (userDetails && userDetails.length > 0) {
              const details = userDetails[0]
              userCertificationId = details.certificationId
              isFirstLogin = details.lastLoginAt === null
              hasCertificate = details.certificateUrl !== null && details.certificateUrl.trim() !== ""
              
              // Get certification name if certificationId exists AND not pending (certificateUrl must be null)
              if (userCertificationId && (details.certificateUrl === null || details.certificateUrl === "")) {
                const cert = await db.certification.findUnique({
                  where: { id: userCertificationId },
                  select: { name: true },
                })
                if (cert) {
                  certificationName = cert.name
                }
              }
              
              // Check if this is a first-time login for a professional with certificate
              if (isFirstLogin && userCertificationId && hasCertificate && userRole !== "ADMIN") {
                try {
                  // Create notification for the user about pending certification review
                  await db.notification.create({
                    data: {
                      type: "SYSTEM",
                      title: "Certification Pending Review",
                      message: "Your certification has been uploaded and is pending review. We'll notify you once it's been reviewed.",
                      userId: userId,
                      metadata: withNotificationI18n(
                        {
                          certificationId: userCertificationId,
                          isFirstLogin: true,
                          timestamp: new Date().toISOString(),
                        },
                        {
                          titleKey: "inApp.certificationPendingTitle",
                          messageKey: "inApp.certificationPendingMessage",
                        }
                      ),
                    },
                  })
                  console.log("✅ Auth: Created pending review notification for first-time professional login:", normalizedEmail)
                } catch (notificationError) {
                  // Log notification error but don't fail the login
                  console.error("❌ Auth: Failed to create notification:", notificationError)
                }
              }
              
              // Update lastLoginAt timestamp
              try {
                await db.user.update({
                  where: { id: userId },
                  data: { lastLoginAt: new Date() },
                })
                console.log("✅ Auth: Updated lastLoginAt for:", normalizedEmail)
              } catch (updateError) {
                // Log update error but don't fail the login
                console.error("❌ Auth: Failed to update lastLoginAt:", updateError)
              }
            }
          } catch (certError) {
            // Certification lookup failed, continue without it
            console.warn("⚠️ Auth: Could not fetch user details:", certError)
          }

          // Don't fetch image here - it's too large for JWT token
          // The session callback will fetch it from database instead
          const authUser = {
            id: userId,
            email: userEmail,
            name: userName,
            role: userRole,
            certification: certificationName || undefined, // Convert null to undefined for NextAuth
            certificationId: userCertificationId || undefined,
            // Don't include image - it causes cookie size issues
            // Session callback will fetch it from database
          }
          
          console.log("✅ Auth: Returning user object for:", normalizedEmail)
          return authUser
        } catch (error: any) {
          if (
            error?.message === "EMAIL_NOT_VERIFIED" ||
            error?.message === "ACCOUNT_BANNED" ||
            error?.message === "ACCOUNT_INACTIVE" ||
            error?.message === "RATE_LIMITED"
          ) {
            throw error
          }
          console.error("❌ Auth: Error during authorization:", error?.message || error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in - set user data (but NOT the image - it's too large for JWT)
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.certification = (user as any).certification
        // Don't store image in token - it's too large and causes cookie size issues
        // We'll fetch it from database in session callback instead
      }

      // Keep sessions honest: ban/deactivate should end access without waiting for re-login
      if (token.id) {
        try {
          const rows = await db.$queryRaw<
            Array<{ isActive: boolean; isBanned: boolean }>
          >`
            SELECT
              u."isActive" AS "isActive",
              EXISTS (
                SELECT 1
                FROM "BannedEmail" b
                WHERE b.email = LOWER(TRIM(u.email))
              ) AS "isBanned"
            FROM "User" u
            WHERE u.id = ${token.id as string}
            LIMIT 1
          `
          const row = rows?.[0]
          if (!row || row.isActive === false || row.isBanned) {
            console.warn("❌ Auth JWT: blocked user — clearing session", token.id)
            // Wipe identity so middleware/session treat the user as signed out
            delete (token as { id?: string }).id
            delete (token as { role?: string }).role
            delete (token as { certification?: string }).certification
            token.error = "ACCOUNT_DISABLED"
            return token
          }
        } catch (checkError) {
          console.error("❌ Auth JWT: ban/active check failed:", checkError)
        }
      }
      
      // When session is updated (e.g., via update() call), just mark that we need to refresh
      // Don't store image in token - fetch it from database in session callback instead
      if (trigger === "update" && token.id) {
        // Just update basic fields that are small enough for token
        if (session?.name !== undefined) token.name = session.name
        if (session?.email !== undefined) token.email = session.email
        // Mark that we need to refresh from database
        token._lastUpdate = Date.now()
      }
      
      return token
    },
    async session({ session, token }) {
      // Banned/inactive JWT wipe leaves no id — treat as signed out
      if (!token?.id || token.error === "ACCOUNT_DISABLED") {
        // Empty expires forces clients to treat session as absent
        return { ...session, user: { ...session.user, id: "", role: "" }, expires: new Date(0).toISOString() }
      }

      if (session.user) {
        (session.user as { id: string }).id = token.id as string
        ;(session.user as { role: string }).role = (token.role as string) || ""
        ;(session.user as { certification?: string }).certification = token.certification as string
        session.user.name = (token.name as string) || session.user.name
        session.user.email = (token.email as string) || session.user.email
        
        // Always fetch image from database (not from token) to avoid cookie size issues
        // This ensures we always have the latest image and don't bloat the JWT token
        try {
          const userResult = await db.$queryRaw<Array<{
            image: string | null
          }>>`
            SELECT image
            FROM "User"
            WHERE id = ${token.id}
            LIMIT 1
          `
          
          if (userResult && userResult.length > 0) {
            session.user.image = userResult[0].image || null
          } else {
            session.user.image = null
          }
        } catch (error) {
          console.error("Failed to fetch user image in session callback:", error)
          session.user.image = null
        }
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return url;
      }

      if (url.startsWith(baseUrl)) {
        return url;
      }

      return baseUrl;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
}

