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
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Normalize email to lowercase (same as registration)
        const normalizedEmail = credentials.email.trim().toLowerCase()

        // Use raw query to avoid schema mismatch issues
        const users = await db.$queryRaw<Array<{
          id: string
          email: string
          password: string
          role: string
          name: string | null
          certificationId: string | null
        }>>`
          SELECT u.id, u.email, u.password, u.role, u.name, u."certificationId"
          FROM "User" u
          WHERE LOWER(u.email) = ${normalizedEmail}
          LIMIT 1
        `

        if (!users || users.length === 0) {
          return null
        }

        const user = users[0]

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        // Get certification if exists
        let certificationName = null
        if (user.certificationId) {
          const certs = await db.$queryRaw<Array<{ id: string; name: string }>>`
            SELECT id, name FROM "Certification" WHERE id = ${user.certificationId} LIMIT 1
          `
          if (certs && certs.length > 0) {
            certificationName = certs[0].name
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          certification: certificationName,
          certificationId: user.certificationId,
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
      // Always redirect to dashboard after login
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

