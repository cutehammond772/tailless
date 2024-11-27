"use client";

import { useState } from "react";
import * as motion from "framer-motion/client";
import { Clock, BookOpen, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlogMoments } from "./blog";
import { IdeaMoments } from "./idea"; 
import MomentTimeline from "./timeline/moment-timeline";
import type { Moment } from "@/db/moment";
import type { Layout } from "@/db/layout";

interface SpaceMomentsProps {
  moments: Moment[];
  layout: Layout;
}

export default function SpaceMoments({ moments, layout }: SpaceMomentsProps) {
  const [activeTab, setActiveTab] = useState<Layout>(layout);
  const glassStyle = "bg-white/10 backdrop-blur-sm";
  const activeTabStyle = "transition-all duration-300 bg-gradient-to-r from-violet-500 via-pink-500 to-orange-500 text-white font-medium shadow-lg scale-105";
  const inactiveTabStyle = "text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-all duration-200";

  const tabs = [
    { value: "timeline" as const, icon: Clock, label: "타임라인" },
    { value: "blog" as const, icon: BookOpen, label: "블로그" },
    { value: "idea" as const, icon: Lightbulb, label: "아이디어" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`rounded-2xl p-3 sm:p-6 ${glassStyle}`}
    >
      <div>
        <motion.div 
          className="flex justify-center mb-4 sm:mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={`grid grid-cols-3 rounded-full p-1 sm:p-1.5 ${glassStyle} shadow-inner`}>
            {tabs.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setActiveTab(value)}
                className={cn(
                  "flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-full transition-all duration-300",
                  "focus:outline-none focus:ring-2 focus:ring-violet-500/50",
                  "active:scale-95 text-nowrap",
                  activeTab === value ? activeTabStyle : inactiveTabStyle
                )}
              >
                <Icon className={cn(
                  "w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300",
                  activeTab === value && "scale-110"
                )} />
                <span className="text-xs sm:text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <div className={`rounded-xl p-2 sm:p-4 ${glassStyle}`}>
          <div className={activeTab === "timeline" ? "block" : "hidden"}>
            <MomentTimeline moments={moments} />
          </div>
          <div className={activeTab === "blog" ? "block" : "hidden"}>
            <BlogMoments moments={moments} />
          </div>
          <div className={activeTab === "idea" ? "block" : "hidden"}>
            <IdeaMoments moments={moments} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
