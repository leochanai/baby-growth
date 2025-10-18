import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/sonner";
import { cookies } from "next/headers";
import { dictionaries } from "@/locales";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
  const saved = cookieStore.get("palette")?.value;
  const ALLOWED = new Set([
    "theme-default",
    "theme-red",
    "theme-orange",
    "theme-green",
    "theme-blue",
    "theme-yellow",
    "theme-violet",
  ]);
  const initialPalette = ALLOWED.has(saved ?? "") ? (saved as string) : "theme-default";
  const initialLanguage = ((): string => {
    const l = cookieStore.get("lang")?.value
    return l === "zh-CN" ? "zh-CN" : "en"
  })()
  const initialMessages = dictionaries[initialLanguage] ?? dictionaries["en"]
  return (
    <html lang={initialLanguage} suppressHydrationWarning className={initialPalette}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers initialPalette={initialPalette} initialLanguage={initialLanguage as any} initialMessages={initialMessages}>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
