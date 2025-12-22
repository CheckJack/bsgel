import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { db } from './db'

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

          // Use raw query to avoid schema mismatch issues with missing columns
          const users = await db.$queryRaw<Array<{
            id: string
            email: string
            password: string
            role: string
            name: string | null
          }>>`
            SELECT id, email, password, role, name
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

          // Get certification if exists (try to fetch certificationId from database)
          let certificationName = null
          let userCertificationId = null
          try {
            const certResult = await db.$queryRaw<Array<{ certificationId: string | null }>>`
              SELECT "certificationId" FROM "User" WHERE id = ${userId} LIMIT 1
            `
            if (certResult && certResult.length > 0 && certResult[0].certificationId) {
              userCertificationId = certResult[0].certificationId
              const cert = await db.certification.findUnique({
                where: { id: userCertificationId },
                select: { name: true },
              })
              if (cert) {
                certificationName = cert.name
              }
            }
          } catch (certError) {
            // Certification lookup failed, continue without it
            console.warn("⚠️ Auth: Could not fetch certification:", certError)
          }

          const authUser = {
            id: userId,
            email: userEmail,
            name: userName,
            role: userRole,
            certification: certificationName || undefined, // Convert null to undefined for NextAuth
            certificationId: userCertificationId || undefined,
          }
          
          console.log("✅ Auth: Returning user object for:", normalizedEmail)
          return authUser
        } catch (error: any) {
          console.error("❌ Auth: Error during authorization:", error?.message || error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.certification = (user as any).certification
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.certification = token.certification as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // If there's a callback URL, use it
      if (url && url.startsWith(baseUrl)) {
        return url
      }
      
      // Default to dashboard (role-based redirect is handled in login page)
      // This callback is only used when redirect: true, but we use redirect: false
      return `${baseUrl}/dashboard`
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
}

