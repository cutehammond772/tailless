import * as motion from "framer-motion/client";
import MomentTimeline from "@/app/(space)/components/timeline";
import { getMoment } from "@/actions/moment/primitives";
import { getSpace } from "@/actions/space/primitives";
import { HttpStatus } from "@/actions/response";

export interface TimelinePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TimelinePage({ params }: TimelinePageProps) {
  const { id } = await params;
  const space = await getSpace({ id });

  if (space.status !== HttpStatus.OK) {
    return <div>Space를 찾을 수 없습니다.</div>;
  }

  const moments = await Promise.all(
    space.data.moments.map((id) => getMoment({ id }))
  );

  const validMoments = moments
    .filter((moment) => moment.status === HttpStatus.OK)
    .map((moment) => moment.data);

  const glassStyle = "bg-white/10 backdrop-blur-sm";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`rounded-2xl p-3 sm:p-6 ${glassStyle}`}
    >
      <div className={`rounded-xl p-2 sm:p-4 ${glassStyle}`}>
        <MomentTimeline moments={validMoments} />
      </div>
    </motion.div>
  );
}
