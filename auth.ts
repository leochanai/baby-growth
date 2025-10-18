import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const authOptions = {
  session: { strategy: "jwt" as const },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (
        credentials: Record<"email" | "password", string> | undefined
      ) => {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null
        const { email, password } = parsed.data
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) return null
        const ok = await bcrypt.compare(password, user.password)
        if (!ok) return null
        return { id: String(user.id), name: user.name, email: user.email }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      // On initial sign in, persist basic profile
      if (user) {
        token.name = user.name
        token.email = user.email
        // load image from DB if available
        const dbUser = await prisma.user.findUnique({ where: { email: user.email as string } })
        if (dbUser?.image) token.picture = dbUser.image
        if (dbUser?.familyName) (token as any).familyName = dbUser.familyName
      }
      // When client calls session.update, sync into token
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name
        if ((session as any).image !== undefined) token.picture = (session as any).image
        if ((session as any).familyName !== undefined) (token as any).familyName = (session as any).familyName
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.name = token.name as string | null
        session.user.email = token.email as string | null
        session.user.image = (token as any).picture ?? null
        ;(session.user as any).familyName = (token as any).familyName ?? null
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}
