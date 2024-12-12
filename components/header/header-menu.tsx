"use client";

import { useCallback, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Hexagon, Loader, Menu, Plus, X } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";

import client from "@/components/motion/client";
import { cn } from "@/lib/utils";

export default function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  const close = useCallback((afterFn?: () => void) => {
    setOpen(false);
    afterFn?.();
  }, []);

  return (
    <>
      {/* Trigger */}
      <client.button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-white/20 transition-colors text-black"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </client.button>

      {/* Menu */}
      <AnimatePresence>
        {open && (
          <>
            <client.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed w-screen h-screen top-0 left-0 bg-black/25 backdrop-blur-sm z-40"
              onClick={() => close()}
            />

            <client.div
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
              <client.div className="w-full p-4 md:p-8">
                <client.div className="flex flex-col gap-6">
                  <client.div className="md:hidden space-y-2">
                    <client.h2 className="text-sm font-semibold text-black px-4">
                      메뉴
                    </client.h2>
                    <client.div className="space-y-1">
                      <Link
                        href="/"
                        onClick={() => close()}
                        className={cn(
                          "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors font-medium text-black"
                        )}
                      >
                        <Hexagon className="w-5 h-5" />
                        <client.span>Spaces</client.span>
                      </Link>
                      <Link
                        href="/moments"
                        onClick={() => close()}
                        className={cn(
                          "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors font-medium text-black"
                        )}
                      >
                        <Loader className="w-5 h-5" />
                        <client.span>Moments</client.span>
                      </Link>
                    </client.div>
                  </client.div>

                  <client.div className="space-y-2">
                    <client.h2 className="text-sm font-semibold text-black px-4">
                      사용자
                    </client.h2>
                    <client.div className="space-y-1">
                      {!session ? (
                        <client.button
                          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/40 transition-colors font-medium text-black"
                          onClick={() =>
                            close(() => {
                              signIn("google", { redirectTo: "/" });
                            })
                          }
                        >
                          로그인
                        </client.button>
                      ) : (
                        <>
                          <Link
                            href={`/user/${session.user.id}`}
                            onClick={() => close()}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/40 transition-colors font-medium text-black"
                          >
                            <Image
                              src={session.user.image || "/default-profile.png"}
                              alt={session.user.name || "프로필 이미지"}
                              width={20}
                              height={20}
                              className="rounded-full"
                            />
                            <client.span>{session.user.name}</client.span>
                          </Link>
                          <Link
                            href="/space/new"
                            onClick={() => close()}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/40 transition-colors font-medium text-black"
                          >
                            <Plus className="w-5 h-5" />
                            <client.span>Space 만들기</client.span>
                          </Link>
                          <Link
                            href="/moment/new"
                            onClick={() => close()}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/40 transition-colors font-medium text-black"
                          >
                            <Plus className="w-5 h-5" />
                            <client.span>Moment 만들기</client.span>
                          </Link>
                          <client.button
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-white/40 transition-colors font-medium text-black"
                            onClick={() =>
                              close(() => {
                                signOut({ callbackUrl: "/" });
                              })
                            }
                          >
                            로그아웃
                          </client.button>
                        </>
                      )}
                    </client.div>
                  </client.div>
                </client.div>
              </client.div>
            </client.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
