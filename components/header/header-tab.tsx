"use client";

import { Hexagon, Loader, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import client from "@/components/motion/client";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface TabButtonProps {
  href: string;
  icon: React.ElementType;
  label: string;
}

function TabButton({ href, icon: Icon, label }: TabButtonProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <client.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ease-in-out",
          isActive
            ? "text-white bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 shadow-lg hover:shadow-xl hover:brightness-110"
            : "text-gray-700 hover:text-gray-900 hover:bg-white/50"
        )}
      >
        <Icon className="w-5 h-5" />
        <client.span className="font-bold text-sm">{label}</client.span>
      </Link>
    </client.div>
  );
}

const NAVIGATION_ITEMS = [
  { href: "/", icon: Sparkles, label: "Home" },
  { href: "/spaces", icon: Hexagon, label: "Space" },
  { href: "/moments", icon: Loader, label: "Moment" },
] as const;

export default function HeaderTab() {
  return (
    <client.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-6">
      <Link href="/" className="md:hidden">
        <client.h1
          className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          Tailless
        </client.h1>
      </Link>
      <client.div className="hidden md:flex items-center gap-6">
        {NAVIGATION_ITEMS.map((item) => (
          <TabButton key={item.href} {...item} />
        ))}
      </client.div>
    </client.div>
  );
}
