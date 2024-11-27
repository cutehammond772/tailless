import * as motion from "framer-motion/client";
import { Clock, BookOpen, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { IdeaMoments } from "@/app/(space)/components/idea";
import { getMoment } from "@/actions/moment/primitives";
import { getSpace } from "@/actions/space/primitives";
import { HttpStatus } from "@/actions/response";

export interface IdeaPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function IdeaPage({ params }: IdeaPageProps) {
  const { id } = await params;
  const space = await getSpace({ id });

  if (space.status !== HttpStatus.OK) {
    return <div>Space를 찾을 수 없습니다.</div>;
  }

  const moments = await Promise.all(
    space.data.moments.map((id) => getMoment({ id }))
  );

  const validMoments = moments.filter(
    (moment) => moment.status === HttpStatus.OK
  ).map((moment) => moment.data);

  const glassStyle = "bg-white/10 backdrop-blur-sm";
  const activeTabStyle =
    "transition-all duration-300 bg-gradient-to-r from-violet-500 via-pink-500 to-orange-500 text-white font-medium shadow-lg scale-105";
  const inactiveTabStyle =
    "text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-all duration-200";

  const tabs = [
    {
      value: "timeline" as const,
      icon: Clock,
      label: "타임라인",
      href: `/space/${id}/timeline`,
    },
    {
      value: "blog" as const,
      icon: BookOpen,
      label: "블로그", 
      href: `/space/${id}/blog`,
    },
    {
      value: "idea" as const,
      icon: Lightbulb,
      label: "아이디어",
      href: `/space/${id}/idea`,
    },
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
          <div
            className={`grid grid-cols-3 rounded-full p-1 sm:p-1.5 ${glassStyle} shadow-inner`}
          >
            {tabs.map(({ value, icon: Icon, label, href }) =>
              value === "idea" ? (
                <button
                  key={value}
                  className={cn(
                    "flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-full transition-all duration-300",
                    "focus:outline-none focus:ring-2 focus:ring-violet-500/50",
                    "active:scale-95 text-nowrap",
                    activeTabStyle
                  )}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 scale-110" />
                  <span className="text-xs sm:text-sm font-medium">
                    {label}
                  </span>
                </button>
              ) : (
                <Link
                  key={value}
                  href={href}
                  className={cn(
                    "flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-full transition-all duration-300",
                    "focus:outline-none focus:ring-2 focus:ring-violet-500/50",
                    "active:scale-95 text-nowrap",
                    inactiveTabStyle
                  )}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300" />
                  <span className="text-xs sm:text-sm font-medium">
                    {label}
                  </span>
                </Link>
              )
            )}
          </div>
        </motion.div>

        <div className={`rounded-xl p-2 sm:p-4 ${glassStyle}`}>
          <IdeaMoments moments={validMoments} />
        </div>
      </div>
    </motion.div>
  );
}
