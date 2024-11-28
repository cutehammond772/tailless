import * as motion from "framer-motion/client";
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

import MomentCard from "@/app/(moment)/components/moment-card";
import MomentContent from "@/app/(moment)/components/moment-content";
import SpaceItem from "@/app/(main)/components/space-item";
import { Hexagon } from "lucide-react";

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
    getSpaces({})
  ]);

  if (moment.status !== HttpStatus.OK) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-bold text-gray-600">Moment를 찾을 수 없습니다</div>
      </div>
    );
  }

  const relatedSpaces = spaces.status === HttpStatus.OK 
    ? spaces.data.filter(space => space.moments.includes(id))
    : [];

  return (
    <motion.div 
      className="min-h-screen p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {relatedSpaces.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
            <Hexagon className="w-5 h-5" />
              <h3 className="text-lg font-semibold">{relatedSpaces.length}개의 연관된 Space</h3>
            </div>
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {relatedSpaces.map((space) => (
                  <CarouselItem key={space.id} className="pl-4 basis-full lg:basis-1/2">
                    <SpaceItem space={space} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex" />
              <CarouselNext className="hidden sm:flex" />
            </Carousel>
          </div>
        )}

        <MomentCard moment={moment.data}>
          <MomentContent moment={moment.data} />
        </MomentCard>
      </div>
    </motion.div>
  );
}
