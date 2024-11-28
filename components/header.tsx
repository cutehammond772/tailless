"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

// Server Actions
import { signIn, signOut, useSession } from "next-auth/react";

// Components
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Hexagon, Loader, Plus } from "lucide-react";

const MotionLink = motion(Link);

export default function Header() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <motion.div
        className={cn(
          "h-12 md:h-16 px-4 md:px-6 my-4 md:my-6",
          "relative flex justify-between items-center",
          "rounded-full bg-white/75 backdrop-blur-lg",
          "border border-white/20 shadow-[0_4px_16px_0_rgba(31,38,135,0.15)]"
        )}
      >
        <motion.div className="invisible md:visible flex items-center gap-4 md:gap-6">
          <Link href="/" onClick={() => setIsMenuOpen(false)}>
            <motion.h1
              className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              Tailless
            </motion.h1>
          </Link>
        </motion.div>
        <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-6">
          <Link href="/" className="md:hidden" onClick={() => setIsMenuOpen(false)}>
            <motion.h1
              className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              Tailless
            </motion.h1>
          </Link>
          <motion.div className="hidden md:flex items-center gap-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <MotionLink
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2 transition-all duration-300 ease-in-out",
                  pathname === "/"
                    ? "text-white bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 px-4 py-2 rounded-full shadow-lg hover:shadow-xl hover:brightness-110"
                    : "text-gray-700 hover:text-gray-900 px-4 py-2 hover:bg-white/50 rounded-full"
                )}
              >
                <Hexagon className="w-5 h-5" />
                <span className="font-bold text-sm">SPACES</span>
              </MotionLink>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <MotionLink
                href="/moments"
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2 transition-all duration-300 ease-in-out",
                  pathname === "/moments"
                    ? "text-white bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 px-4 py-2 rounded-full shadow-lg hover:shadow-xl hover:brightness-110"
                    : "text-gray-700 hover:text-gray-900 px-4 py-2 hover:bg-white/50 rounded-full"
                )}
              >
                <Loader className="w-5 h-5" />
                <span className="font-bold text-sm">MOMENTS</span>
              </MotionLink>
            </motion.div>
          </motion.div>
        </motion.div>
        <motion.button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-full hover:bg-white/20 transition-colors text-black"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/25 backdrop-blur-sm z-40"
              onClick={() => setIsMenuOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                mass: 1,
              }}
              className={cn(
                "fixed left-0 right-0 mx-auto top-[80px] md:top-[100px] z-50",
                "w-[95vw] md:w-[90vw] max-w-2xl overflow-hidden",
                "bg-white/60 backdrop-blur-lg border border-white/20",
                "rounded-2xl md:rounded-3xl shadow-[0_4px_16px_0_rgba(31,38,135,0.15)]"
              )}
            >
              <motion.div className="w-full p-4 md:p-8">
                <motion.div className="flex flex-col gap-6">
                  <motion.div className="md:hidden space-y-2">
                    <motion.h2 className="text-sm font-semibold text-black px-4">
                      메뉴
                    </motion.h2>
                    <motion.div className="space-y-1">
                      <Link
                        href="/"
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors font-medium text-black",
                          pathname === "/" ? "bg-white/40" : "hover:bg-white/40"
                        )}
                      >
                        <Hexagon className="w-5 h-5" />
                        <span>Spaces</span>
                      </Link>
                      <Link
                        href="/moments"
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors font-medium text-black",
                          pathname === "/moments"
                            ? "bg-white/40"
                            : "hover:bg-white/40"
                        )}
                      >
                        <Loader className="w-5 h-5" />
                        <span>Moments</span>
                      </Link>
                    </motion.div>
                  </motion.div>

                  <motion.div className="space-y-2">
                    <motion.h2 className="text-sm font-semibold text-black px-4">
                      사용자
                    </motion.h2>
                    <motion.div className="space-y-1">
                      {!session ? (
                        <motion.button
                          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/40 transition-colors font-medium text-black"
                          onClick={() => {
                            setIsMenuOpen(false);
                            signIn("google", { redirectTo: "/" });
                          }}
                        >
                          로그인
                        </motion.button>
                      ) : (
                        <>
                          <Link
                            href={`/user/${session.user.id}`}
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/40 transition-colors font-medium text-black"
                          >
                            <Image
                              src={session.user.image || "/default-profile.png"}
                              alt={session.user.name || "프로필 이미지"}
                              width={20}
                              height={20}
                              className="rounded-full"
                            />
                            <span>{session.user.name}</span>
                          </Link>
                          <Link
                            href="/space/new"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/40 transition-colors font-medium text-black"
                          >
                            <Plus className="w-5 h-5" />
                            <span>Space 만들기</span>
                          </Link>
                          <Link
                            href="/moment/new"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/40 transition-colors font-medium text-black"
                          >
                            <Plus className="w-5 h-5" />
                            <span>Moment 만들기</span>
                          </Link>
                          <motion.button
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/40 transition-colors font-medium text-black"
                            onClick={() => {
                              setIsMenuOpen(false);
                              signOut({ callbackUrl: "/" });
                            }}
                          >
                            로그아웃
                          </motion.button>
                        </>
                      )}
                    </motion.div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
