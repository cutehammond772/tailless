import * as motion from "framer-motion/client";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Moment } from "@/db/moment";
import MomentCard from "./moment-card";
import MomentContent from "./moment-content";
import { Suspense } from "react";
import { formatDate } from "@/lib/utils";

interface MomentTimelineProps {
  moments: Moment[];
}

export default function MomentTimeline({ moments }: MomentTimelineProps) {
  // 날짜별로 모먼트 그룹핑
  const groupedMoments = moments.reduce((groups: Record<string, Moment[]>, moment) => {
    const date = formatDate(moment.createdAt);
    
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(moment);
    return groups;
  }, {});

  // 마지막 수정일 기준으로 내림차순 정렬
  const sortedGroupedMoments = Object.entries(groupedMoments).sort((a, b) => {
    const latestMomentA = a[1].reduce((latest, moment) => 
      new Date(moment.modifiedAt) > new Date(latest.modifiedAt) ? moment : latest
    );
    const latestMomentB = b[1].reduce((latest, moment) => 
      new Date(moment.modifiedAt) > new Date(latest.modifiedAt) ? moment : latest
    );
    return new Date(latestMomentB.modifiedAt).getTime() - new Date(latestMomentA.modifiedAt).getTime();
  });

  return (
    <motion.div className="space-y-8">
      {sortedGroupedMoments.map(([date, dateMoments]) => (
        <div key={date} className="space-y-6">
          <div className="flex justify-center">
            <Badge 
              variant="outline" 
              className="bg-white/70 backdrop-blur-sm px-4 py-1.5 flex items-center gap-2 shadow-sm"
            >
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700 font-medium">{date}</span>
            </Badge>
          </div>
          {dateMoments.map((moment) => (
            <MomentCard key={moment.id} moment={moment}>
              <Suspense fallback={<div>Loading...</div>}>
                <MomentContent moment={moment} />
              </Suspense>
            </MomentCard>
          ))}
        </div>
      ))}
    </motion.div>
  );
}
