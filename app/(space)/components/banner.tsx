import * as motion from "framer-motion/client";
import { Tags, Calendar } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Space } from "@/db/space";
import { User } from "@/db/user";
import SpaceContributors from "@/features/space/space-contributors";
import SpaceOptions from "@/features/space/space-options";
import { formatDate } from "@/lib/utils";

export default function SpaceBanner({
  space,
  contributors,
}: {
  space: Space;
  contributors: User[];
}) {
  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl shadow-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* 배경 이미지 */}
      <motion.div
        className="aspect-video transform bg-cover bg-center transition-transform duration-500"
        style={{
          backgroundImage: `url(${space.image})`,
        }}
      />

      {/* 그라데이션 오버레이 */}
      <motion.div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

      {/* 컨텐츠 영역 */}
      <motion.div className="absolute bottom-0 w-full px-4 py-6 sm:px-8 sm:py-8 md:px-12 md:py-12">
        <motion.div className="space-y-4 sm:space-y-6">
          {/* 제목과 설명 */}
          <motion.div className="space-y-2 sm:space-y-3">
            <motion.h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              {space.title}
            </motion.h1>
            <motion.p className="max-w-3xl text-sm sm:text-base md:text-lg text-white/90">
              {space.description}
            </motion.p>
          </motion.div>

          {/* 메타데이터 */}
          <motion.div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
            {/* 태그 */}
            <motion.div className="flex items-center gap-2 sm:gap-3">
              <Tags className="h-4 w-4 sm:h-5 sm:w-5 text-white/80" />
              <motion.div className="flex flex-wrap gap-2">
                {space.tags.map((tag: string) => (
                  <Badge
                    key={tag}
                    className="border-none bg-white/20 text-white hover:bg-white/30 text-xs sm:text-sm"
                  >
                    {tag}
                  </Badge>
                ))}
              </motion.div>
            </motion.div>

            {/* 생성일 */}
            <motion.div className="flex items-center gap-2 sm:gap-3">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white/80" />
              <motion.p className="text-white/90 text-xs sm:text-sm text-nowrap">
                {formatDate(space.createdAt)}
              </motion.p>
            </motion.div>

            <motion.div className="flex items-center gap-2 sm:gap-3">
              {/* 기여자 */}
              <SpaceContributors space={space} contributors={contributors} />

              {/* 옵션 */}
              <SpaceOptions space={space} />
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
