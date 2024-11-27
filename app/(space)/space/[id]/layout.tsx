import * as motion from "framer-motion/client";

import { HttpStatus } from "@/actions/response";
import { getSpace, getSpaces } from "@/actions/space/primitives";
import { getUser } from "@/actions/user";
import SpaceBanner from "../../components/banner";

export async function generateStaticParams() {
  const spaces = await getSpaces({});

  if (spaces.status !== HttpStatus.OK) {
    return [];
  }

  return spaces.data.map((space) => ({
    id: space.id,
  }));
}

export interface SpacePageProps {
  params: Promise<{
    id: string;
  }>;
  children: React.ReactNode;
}

export default async function SpacePage({ params, children }: SpacePageProps) {
  const { id } = await params;
  const space = await getSpace({ id });

  if (space.status !== HttpStatus.OK) {
    return <div>Space not found</div>;
  }

  // Fetch all contributors
  const contributorsPromises = space.data.contributors.map(async (userId) => {
    const user = await getUser(userId);
    if (user.status === HttpStatus.OK) {
      return user.data;
    }
    return null;
  });

  const contributors = await Promise.all(contributorsPromises);

  const filteredContributors = contributors.filter(
    (contributor): contributor is NonNullable<typeof contributor> => contributor !== null
  );

  return (
    <motion.div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-4 md:px-8 md:py-8">
      <motion.div className="space-y-8">
        {/* Space Banner */}
        <SpaceBanner space={space.data} contributors={filteredContributors} />
        {children}
      </motion.div>
    </motion.div>
  );
}
