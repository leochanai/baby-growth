import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { cookies } from "next/headers";
import { dictionaries } from "@/locales";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"], // Utilize variable axes for personality
});

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Baby Growth",
  description: "Baby Growth – 宝宝生长跟踪",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const session = (await getServerSession()) as Session | null;
  
  // 优先从数据库读取用户设置
  let userTheme: string | null = null;
  let userPalette: string | null = null;
  let userLanguage: string | null = null;
  
  if (session?.user?.email) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { theme: true, palette: true, language: true },
      });
      userTheme = user?.theme ?? null;
      userPalette = user?.palette ?? null;
      userLanguage = user?.language ?? null;
    } catch {}
  }
  
  // 如果没有数据库设置，则从cookie读取
  const savedPalette = cookieStore.get("palette")?.value;
  // New design replaces the palette system with a single strong theme, 
  // but we keep logic for backward compatibility or future multi-theme support
  const initialPalette: string = "theme-editorial"; // Force new theme
  
  const savedLanguage = cookieStore.get("lang")?.value;
  const initialLanguage = userLanguage || (savedLanguage === "zh-CN" ? "zh-CN" : "en");
  const initialMessages = dictionaries[initialLanguage] ?? dictionaries["en"];
  
  // 注意：theme模式不在html标签上设置，而是在ThemeProvider中处理
  return (
    <html lang={initialLanguage} suppressHydrationWarning className={initialPalette}>
      <body className={`${fraunces.variable} ${manrope.variable} font-sans antialiased`}>
        <Providers 
          initialPalette={initialPalette} 
          initialLanguage={initialLanguage as any} 
          initialMessages={initialMessages}
          initialTheme={userTheme as "light" | "dark" | "system" | undefined}
        >
          {children}
          <Toaster richColors closeButton position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
