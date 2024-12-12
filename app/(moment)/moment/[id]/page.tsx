import * as motion from "framer-motion/client";
import { Hexagon } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { HttpStatus } from "@/actions/response";
import { getMoments, getMoment } from "@/actions/moment/primitives";
import { getSpaces } from "@/actions/space/primitives";
import { Space } from "@/db/space";

import MomentCard from "@/features/moment/moment-card";
import MomentContent from "@/features/moment/moment-content";
import SpaceCard from "@/features/space/space-card";

interface RelatedSpacesProps {
  spaces: Space[];
}

function RelatedSpaces({ spaces }: RelatedSpacesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <motion.div
        className="flex items-center gap-3 mb-4"
        initial={{ x: -20 }}
        animate={{ x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.4 }}>
          <Hexagon className="w-6 h-6 text-violet-500" />
        </motion.div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
          연관 Space
        </h3>
      </motion.div>

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {spaces.map((space, index) => (
            <CarouselItem
              key={space.id}
              className="pl-4 basis-full lg:basis-1/2"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.5 }}
                whileHover={{ scale: 1.02 }}
                className="h-full"
              >
                <SpaceCard space={space} />
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex -left-12 bg-white/80 hover:bg-white" />
        <CarouselNext className="hidden sm:flex -right-12 bg-white/80 hover:bg-white" />
      </Carousel>
    </motion.div>
  );
}

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
  const [moment, spaces] = await Promise.all([
    getMoment({ id }),
    getSpaces({}),
  ]);

  if (moment.status !== HttpStatus.OK) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-bold text-gray-600">
          Moment를 찾을 수 없습니다
        </div>
      </div>
    );
  }

  const relatedSpaces =
    spaces.status === HttpStatus.OK
      ? spaces.data.filter((space) => space.moments.includes(id))
      : [];

  return (
    <motion.div
      className="min-h-screen p-2 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {relatedSpaces.length > 0 && <RelatedSpaces spaces={relatedSpaces} />}

        <MomentCard moment={moment.data}>
          <MomentContent moment={moment.data} />
        </MomentCard>
      </div>
    </motion.div>
  );
}
