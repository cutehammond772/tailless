import { Suspense } from "react";
import Link from "next/link";

import server from "@/components/motion/server";
import { cn } from "@/lib/utils";
import HeaderMenu from "./header-menu";
import { Menu } from "lucide-react";
import HeaderTab from "./header-tab";

export default function HeaderBody() {
  return (
    <server.div
      className={cn(
        "h-12 md:h-16 px-4 md:px-6 my-4 md:my-6",
        "flex justify-between items-center",
        "rounded-full bg-white/75",
        "border border-white/20 shadow-md"
      )}
    >
      {/* 로고 */}
      <server.div className="invisible md:visible flex items-center gap-4 md:gap-6">
        <Link href="/">
          <server.span
            className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            Tailless
          </server.span>
        </Link>
      </server.div>

      {/* 탭 */}
      <Suspense fallback={<server.div>Loading...</server.div>}>
        <HeaderTab />
      </Suspense>

      {/* 메뉴 */}
      <Suspense fallback={<Menu size={24} />}>
        <HeaderMenu />
      </Suspense>
    </server.div>
  );
}
