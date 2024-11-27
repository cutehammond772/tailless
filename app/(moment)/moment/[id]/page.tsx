import * as motion from "framer-motion/client";

import { HttpStatus } from "@/actions/response";
import { getMoments, getMoment } from "@/actions/moment/primitives";

import MomentCard from "@/app/(moment)/components/moment-card";
import MomentContent from "@/app/(moment)/components/moment-content";

export async function generateStaticParams() {
  const moments = await getMoments({});

  if (moments.status !== HttpStatus.OK) {
    return [];
  }

  return moments.data.map((moment) => ({ id: moment.id }));
}

export interface MomentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MomentPage({ params }: MomentPageProps) {
  const { id } = await params;
  const moment = await getMoment({ id });

  if (moment.status !== HttpStatus.OK) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-bold text-gray-600">Moment를 찾을 수 없습니다</div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-4xl mx-auto">
        <MomentCard moment={moment.data}>
          <MomentContent moment={moment.data} />
        </MomentCard>
      </div>
    </motion.div>
  );
}
