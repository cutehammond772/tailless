import * as motion from "framer-motion/client";
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

  const validMoments = moments
    .filter((moment) => moment.status === HttpStatus.OK)
    .map((moment) => moment.data);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <IdeaMoments moments={validMoments} />
    </motion.div>
  );
}
