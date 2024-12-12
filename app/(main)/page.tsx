"use client";

import { useSession } from "next-auth/react";
import { Hexagon, Loader, LogIn, Plus, Star, Sparkles, BrainCircuit } from "lucide-react";
import { useRouter } from "next/navigation";
import * as motion from "framer-motion/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import client from "@/components/motion/client";
import { cn } from "@/lib/utils";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { recommendSpace } from "@/actions/ai/space";
import SpaceCard from "@/features/space/space-card";
import { Space } from "@/db/space";
import { getSpace } from "@/actions/space/primitives";
import { HttpStatus } from "@/actions/response";
import { signIn } from "next-auth/react";

interface CardProps {
  title: string;
  description: string;
  href?: string;
  icon?: React.ElementType;
  emphasized?: boolean;
  onClick?: () => void;
}

function Card({
  title,
  description,
  href,
  icon: Icon,
  emphasized,
  onClick,
}: CardProps) {
  const router = useRouter();
  const handleClick = () => {
    if (href) {
      router.push(href);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <client.button
      onClick={handleClick}
      className={cn(
        "block w-full p-6 rounded-2xl transition-all duration-300",
        "hover:shadow-xl hover:scale-[1.03] hover:translate-y-[-4px]",
        emphasized
          ? "bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 text-white shadow-purple-200"
          : "bg-white/70 backdrop-blur-md hover:bg-white shadow-gray-100"
      )}
    >
      <client.div className="flex items-start gap-4">
        {Icon && (
          <Icon
            className={cn(
              "w-8 h-8 transition-transform group-hover:scale-110",
              emphasized ? "text-white" : "text-purple-500"
            )}
          />
        )}
        <client.div className="flex-1 text-left">
          <client.h3 className="text-lg font-bold mb-2 tracking-tight">{title}</client.h3>
          <client.p
            className={cn(
              "text-sm leading-relaxed",
              emphasized ? "text-white/90" : "text-gray-600"
            )}
          >
            {description}
          </client.p>
        </client.div>
      </client.div>
    </client.button>
  );
}

interface SpaceWithScore extends Space {
  score: number;
}

function SpaceCarousel({ spaces }: { spaces: SpaceWithScore[] }) {
  if (spaces.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12 bg-white/50 backdrop-blur-sm rounded-xl">
        <Loader className="w-8 h-8 mx-auto mb-4 text-purple-400 animate-spin" />
        <p>당신에게 걸맞는 Space를 찾고 있어요</p>
      </div>
    );
  }

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full relative group"
    >
      <CarouselContent className="-ml-4">
        {spaces.map((space) => (
          <CarouselItem
            key={space.id}
            className="pl-4 basis-full lg:basis-1/2"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03, y: -4 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <SpaceCard space={space} />
            </motion.div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex -left-12 bg-white shadow-lg hover:bg-purple-50" />
      <CarouselNext className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex -right-12 bg-white shadow-lg hover:bg-purple-50" />
    </Carousel>
  );
}

function SpaceSearch() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<{
    id: string;
    tagScores: {
      tag: string;
      similarity: number;
    }[];
  }[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [filteredSpaces, setFilteredSpaces] = useState<SpaceWithScore[]>([]);

  useEffect(() => {
    if (selectedTag && spaces.length && recommendations.length) {
      const spacesWithScores = spaces.map(space => {
        const recommendation = recommendations.find(r => r.id === space.id);
        const tagScore = recommendation?.tagScores.find(t => t.tag === selectedTag);
        return {
          ...space,
          score: tagScore?.similarity || 0
        };
      });

      const filtered = spacesWithScores
        .filter(space => space.score > 0)
        .sort((a, b) => b.score - a.score);

      setFilteredSpaces(filtered);
    }
  }, [selectedTag, spaces, recommendations]);

  const handleSearch = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      const result = await recommendSpace({ content: prompt });
      if (result.status === "success" && result.recommendations) {
        const uniqueTags = Array.from(new Set(
          result.recommendations.flatMap(r => r.tagScores.map(t => t.tag))
        ));
        setTags(uniqueTags);
        setRecommendations(result.recommendations);
        if (uniqueTags.length > 0) {
          setSelectedTag(uniqueTags[0]);
        }

        const spacePromises = result.recommendations.map(async rec => {
          const spaceResult = await getSpace({ id: rec.id });
          if (spaceResult.status === HttpStatus.OK && spaceResult.data) {
            return spaceResult.data;
          }
          return null;
        });

        const fetchedSpaces = (await Promise.all(spacePromises)).filter((space): space is Space => space !== null);
        setSpaces(fetchedSpaces);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="space-y-8 bg-white/30 backdrop-blur-sm rounded-3xl p-8 shadow-xl"
    >
      <client.div className="flex gap-3 max-w-2xl mx-auto">
        <Input
          placeholder="어떤 주제에 관심이 있으신가요?"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 h-12 text-lg shadow-inner bg-white/80 border-purple-100 focus:border-purple-300 focus:ring-purple-200 placeholder:text-gray-400"
        />
        <Button 
          onClick={handleSearch} 
          disabled={loading}
          className={cn(
            "h-12 px-6 shadow-lg transition-all duration-300",
            "bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500",
            "hover:shadow-purple-200 hover:scale-105 hover:translate-y-[-2px]",
            "disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0",
            "group"
          )}
        >
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <BrainCircuit className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">추천받기</span>
            </>
          )}
        </Button>
      </client.div>

      {tags.length > 0 && (
        <motion.div 
          className="space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h3 className="text-xl font-semibold text-gray-800">추천 키워드</h3>
            </div>
          </div>
          
          <Tabs value={selectedTag} onValueChange={setSelectedTag} className="w-full">
            <TabsList className="w-full justify-center gap-2 bg-transparent p-2">
              {tags.map((tag) => (
                <TabsTrigger 
                  key={tag} 
                  value={tag}
                  className={cn(
                    "px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200",
                    "data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500",
                    "data-[state=active]:text-white data-[state=active]:shadow-lg",
                    "hover:bg-purple-50"
                  )}
                >
                  {tag}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={selectedTag} className="mt-8">
              <SpaceCarousel spaces={filteredSpaces} />
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function MainPage() {
  const { data: session } = useSession();

  return (
    <client.div
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <client.div className="max-w-6xl mx-auto space-y-12 flex flex-col gap-8">
        <SpaceSearch />
        
        <client.div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 [&>*:first-child]:md:col-span-2">
          {!session ? (
            <>
              <Card
                title="Tailless에 오신 것을 환영합니다!"
                description="로그인하고 나만의 Space와 Moment를 만들어보세요."
                icon={LogIn}
                emphasized
                onClick={() => signIn("google", { redirectTo: "/" })}
              />
              <Card
                title="인기 Space 둘러보기"
                description="다른 사용자들이 만든 흥미로운 Space를 확인해보세요."
                href="/spaces"
                icon={Hexagon}
              />
              <Card
                title="트렌딩 Moment"
                description="지금 가장 인기있는 Moment를 확인해보세요."
                href="/moments"
                icon={Loader}
              />
            </>
          ) : (
            <>
              <Card
                title="나의 활동"
                description="내가 작성한 게시물과 참여한 활동을 한눈에 확인하세요."
                href={`/user/${session.user?.id}`}
                icon={Star}
                emphasized
              />
              <Card
                title="새로운 Space 만들기"
                description="나만의 독특한 Space를 만들어 다른 사람들과 공유해보세요."
                href="/space/new"
                icon={Plus}
              />
              <Card
                title="새로운 Moment 만들기"
                description="특별한 순간을 Moment로 기록하고 공유해보세요."
                href="/moment/new"
                icon={Plus}
              />
            </>
          )}
        </client.div>
      </client.div>
    </client.div>
  );
}
