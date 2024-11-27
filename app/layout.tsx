import localFont from "next/font/local";
import { SessionProvider } from "next-auth/react";
import * as motion from "framer-motion/client";

import "./globals.css";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import Header from "@/components/header";
import { Toaster } from "@/components/ui/toaster";
import { Suspense } from "react";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body
        className={cn(pretendard.className, "antialiased")}
      >
        <SessionProvider session={await auth()}>
          <motion.div
            className={cn(
              // 기본 레이아웃
              "min-h-screen",
              "flex flex-col",
              // 모바일 최적화
              "px-4 md:px-0",
              // 데스크톱 레이아웃
              "md:grid md:grid-cols-[1fr_minmax(768px,_2fr)_1fr]",
              // 배경
              "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50"
            )}
          >
            {/* 헤더 */}
            <motion.header
              className={cn(
                "sticky top-0 z-30",
                "w-full md:col-start-2 md:col-span-1"
              )}
            >
              <Suspense fallback={<div>Loading...</div>}>
                <Header />
              </Suspense>
            </motion.header>

            {/* 메인 컨텐츠 */}
            <motion.main
              className={cn(
                "flex-1",
                "w-full max-w-full",
                "md:col-start-2 md:col-span-1",
                "py-6 md:py-8"
              )}
            >
              {children}
            </motion.main>
          </motion.div>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
