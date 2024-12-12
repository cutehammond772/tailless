import Image from "next/image";
import server from "@/components/motion/server";
import Link from "next/link";
import { Hexagon, Loader, ArrowRight } from "lucide-react";

import { HttpStatus } from "@/actions/response";
import { getSpaces } from "@/actions/space/primitives";
import { getMoments } from "@/actions/moment/primitives";
import { cn } from "@/lib/utils";
import { getUser } from "@/actions/user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SpaceCard from "@/features/space/space-card";
import { User } from "@/db/user";

// 타입 정의
export interface UserPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface ProfileSectionProps {
  user: User;
  spacesCount: number;
  momentsCount: number;
}

interface MomentCardProps {
  moment: {
    id: string;
    title: string;
    content: string;
    createdAt: string;
  };
}

interface GlassContainerProps {
  children: React.ReactNode;
}

// 컴포넌트 분리
const ProfileSection = ({ user, spacesCount, momentsCount }: ProfileSectionProps) => (
  <server.div
    className={cn(
      "backdrop-blur-md bg-white/20",
      "border border-white/30",
      "rounded-3xl",
      "shadow-[0_4px_24px_0_rgba(0,0,0,0.1)]",
      "p-8"
    )}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
  >
    <server.div className="flex items-center gap-6">
      <Image
        src={user.image ?? "/favicon.ico"}
        alt="User avatar"
        width={96}
        height={96}
        className="rounded-full border-2 border-white/50"
      />
      <server.div className="flex flex-col">
        <server.div className="text-2xl font-bold">{user.name}</server.div>
        <server.div className="text-gray-700">{user.email}</server.div>
        <server.div className="mt-2 text-sm text-gray-600">
          <server.span className="font-medium">{spacesCount}</server.span> Spaces ·{" "}
          <server.span className="font-medium">{momentsCount}</server.span> Moments
        </server.div>
      </server.div>
    </server.div>
  </server.div>
);

const MomentCard = ({ moment }: MomentCardProps) => (
  <server.article
    key={moment.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
    className="bg-white/50 rounded-xl p-6 space-y-4"
  >
    <server.h3 className="text-xl font-bold">{moment.title}</server.h3>
    <server.p className="text-gray-600 line-clamp-3">{moment.content}</server.p>
    <server.div className="flex items-center justify-between text-sm text-gray-500">
      <server.span>{new Date(moment.createdAt).toLocaleDateString()}</server.span>
      <Link
        href={`/moment/${moment.id}`}
        className="flex items-center gap-2 hover:text-gray-900 transition-colors"
      >
        자세히 보기
        <ArrowRight className="w-4 h-4" />
      </Link>
    </server.div>
  </server.article>
);

const GlassContainer = ({ children }: GlassContainerProps) => (
  <server.div className={cn(
    "backdrop-blur-md bg-white/20",
    "border border-white/30",
    "rounded-3xl",
    "shadow-[0_4px_24px_0_rgba(0,0,0,0.1)]",
    "p-8"
  )}>
    {children}
  </server.div>
);

export default async function UserPage({ params }: UserPageProps) {
  const userId = (await params).id;
  const userResponse = await getUser(userId);

  if (userResponse.status !== HttpStatus.OK) {
    return <server.div>사용자를 찾을 수 없습니다.</server.div>;
  }

  const user = userResponse.data;
  const spaces = await getSpaces({ contributors: [userId] });
  const moments = await getMoments({ author: userId });

  if (spaces.status !== HttpStatus.OK) {
    return <server.div>Space를 불러올 수 없습니다.</server.div>;
  }

  if (moments.status !== HttpStatus.OK) {
    return <server.div>Moment를 불러올 수 없습니다.</server.div>;
  }

  return (
    <server.div className="min-h-screen space-y-8">
      <ProfileSection 
        user={user} 
        spacesCount={spaces.data.length} 
        momentsCount={moments.data.length} 
      />

      <Tabs defaultValue="spaces" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 gap-4">
          <TabsTrigger value="spaces" className="gap-2">
            <Hexagon className="w-4 h-4" />
            Spaces
          </TabsTrigger>
          <TabsTrigger value="moments" className="gap-2">
            <Loader className="w-4 h-4" />
            Moments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="spaces">
          <GlassContainer>
            <server.h2 className="text-xl font-bold mb-6">기여 중인 Spaces</server.h2>
            <server.div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {spaces.data.map((space) => (
                <SpaceCard key={space.id} space={space} />
              ))}
            </server.div>
          </GlassContainer>
        </TabsContent>

        <TabsContent value="moments">
          <GlassContainer>
            <server.h2 className="text-xl font-bold mb-6">작성한 Moments</server.h2>
            <server.div className="space-y-6">
              {moments.data.map((moment) => (
                <MomentCard key={moment.id} moment={moment} />
              ))}
            </server.div>
          </GlassContainer>
        </TabsContent>
      </Tabs>
    </server.div>
  );
}
