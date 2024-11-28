import Link from "next/link";
import * as motion from "framer-motion/client";

import { Tags, Users, ArrowRight, BookOpen, Lightbulb, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Space } from "@/db/space";

export default function SpaceCard({ space }: { space: Space }) {
  const layoutIcons = {
    blog: <BookOpen className="w-4 h-4" />,
    idea: <Lightbulb className="w-4 h-4" />,
    timeline: <Clock className="w-4 h-4" />
  };

  const layoutLabels = {
    blog: "블로그",
    idea: "아이디어",
    timeline: "타임라인"
  };

  return (
    <Link href={`/space/${space.id}`} key={space.title}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="group relative aspect-[4/5] rounded-xl md:rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300"
      >
        {/* 배경 이미지 */}
        <motion.div
          className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-500"
          style={{
            backgroundImage: `url(${space.image})`,
          }}
        />

        {/* 그라데이션 오버레이 */}
        <motion.div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

        {/* 컨텐츠 영역 */}
        <motion.div className="absolute inset-0 flex flex-col justify-end p-6 md:p-6 lg:p-8">
          <motion.div className="space-y-4 md:space-y-4 transform group-hover:translate-y-[-8px] transition-transform duration-300">
            {/* 제목과 설명 */}
            <motion.div className="space-y-2 md:space-y-2">
              <motion.div className="flex items-center gap-2 text-white/80 mb-1">
                {layoutIcons[space.layout]}
                <motion.span className="text-xs">
                  {layoutLabels[space.layout]}
                </motion.span>
              </motion.div>
              <motion.h1 className="text-2xl md:text-2xl lg:text-3xl font-bold text-white">
                {space.title}
              </motion.h1>
              <motion.p className="text-sm md:text-sm lg:text-base text-white/80 line-clamp-2">
                {space.description}
              </motion.p>
            </motion.div>

            {/* 태그와 기여자 정보 */}
            <motion.div className="space-y-3 md:space-y-3">
              <motion.div className="flex items-center gap-2">
                <Tags className="w-4 h-4 md:w-4 md:h-4 text-white/80" />
                <motion.div className="flex gap-2 md:gap-2 flex-wrap">
                  {space.tags.map((tag) => (
                    <Badge
                      key={tag}
                      className="bg-white/20 hover:bg-white/30 text-white border-none text-xs md:text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </motion.div>
              </motion.div>
              
              <motion.div className="flex items-center justify-between">
                <motion.div className="flex items-center gap-2 text-white/80">
                  <Users className="w-4 h-4 md:w-4 md:h-4" />
                  <motion.p className="text-sm md:text-sm">
                    {space.contributors.length}명의 기여자
                  </motion.p>
                </motion.div>
                <ArrowRight className="w-5 h-5 md:w-5 md:h-5 text-white/80 transform group-hover:translate-x-1 transition-all duration-300" />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </Link>
  );
}