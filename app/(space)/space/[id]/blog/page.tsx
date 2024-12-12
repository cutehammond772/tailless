import * as motion from "framer-motion/client";
import { BlogMoments } from "@/app/(space)/components/blog";
import { getMoment } from "@/actions/moment/primitives";
import { getSpace } from "@/actions/space/primitives";
import { HttpStatus } from "@/actions/response";

export interface BlogPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BlogPage({ params }: BlogPageProps) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <BlogMoments moments={validMoments} />
    </motion.div>
  );
}
