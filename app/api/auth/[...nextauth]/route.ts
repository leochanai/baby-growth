/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from "next-auth/next"
import { authOptions } from "@/auth"

// Instantiate NextAuth with local Prisma-based credentials auth
const handler = (NextAuth as any)(authOptions as any)

export { handler as GET, handler as POST }
