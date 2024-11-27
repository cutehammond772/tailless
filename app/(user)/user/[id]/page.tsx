import Image from "next/image";
import * as motion from "framer-motion/client";
import { authorizeUser, logout } from "@/actions/auth";

import { Button } from "@/components/ui/button";
import { HttpStatus } from "@/actions/response";
import { createSpace, getSpaces } from "@/actions/space/primitives";
import { createMoment, getMoments } from "@/actions/moment/primitives";
import { addMomentToSpace } from "@/actions/space/moment";

import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CreateSpace } from "@/db/space";
import { CreateMoment } from "@/db/moment";
import { z } from "zod";
import { cn } from "@/lib/utils";
import MomentTimeline from "@/app/(main)/components/moment-timeline";
import { getUser } from "@/actions/user";

export interface UserPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserPage({ params }: UserPageProps) {
  const userId = (await params).id;
  const authorization = await authorizeUser();

  // 로그인한 사용자가 있는 경우에만 isOwner 체크
  const isOwner = authorization.status === HttpStatus.OK && authorization.data.id === userId;

  const userResponse = await getUser(userId);

  if (userResponse.status !== HttpStatus.OK) {
    return <div>사용자를 찾을 수 없습니다.</div>;
  }

  const user = userResponse.data;
  const spaces = await getSpaces({ contributors: [userId] });
  const moments = await getMoments({ author: userId });

  if (spaces.status !== HttpStatus.OK) {
    return <div>Space를 불러올 수 없습니다.</div>;
  }

  if (moments.status !== HttpStatus.OK) {
    return <div>Moment를 불러올 수 없습니다.</div>;
  }

  return (
    <motion.div className="min-h-screen space-y-8">
      {/* 프로필 섹션 */}
      <motion.div 
        className={cn(
          "backdrop-blur-lg bg-white/30",
          "border border-white/20",
          "rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]",
          "p-8"
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-6">
          <Image
            src={user.image ?? "/favicon.ico"}
            alt="User avatar"
            width={96}
            height={96}
            className="rounded-full border-2 border-white/50"
          />
          <div className="flex flex-col">
            <div className="text-2xl font-bold">{user.name}</div>
            <div className="text-gray-700">{user.email}</div>
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">{spaces.data.length}</span> Spaces ·{" "}
              <span className="font-medium">{moments.data.length}</span> Moments
            </div>
          </div>
        </div>
      </motion.div>

      {isOwner ? (
        <motion.div 
          className={cn(
            "backdrop-blur-lg bg-white/30",
            "border border-white/20",
            "rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]",
            "p-8 space-y-8"
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* 로그아웃 버튼 */}
          <form
            action={async () => {
              "use server";
              await logout({ redirectTo: "/" });
            }}
          >
            <Button variant="destructive" type="submit">
              로그아웃
            </Button>
          </form>

          {/* Space에 Moment 추가 폼 */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Space에 Moment 추가</h2>
            <form
              action={async (formData: FormData) => {
                "use server";
                const spaceId = formData.get("spaceId") as string;
                const momentId = formData.get("momentId") as string;
                await addMomentToSpace(spaceId, momentId);
              }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex flex-col">
                <label htmlFor="spaceId" className="mb-2 text-sm font-medium">
                  Space 선택
                </label>
                <Select name="spaceId" required>
                  <SelectTrigger className="bg-white/50 border-white/20">
                    <SelectValue placeholder="Space를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {spaces.data.map((space) => (
                      <SelectItem key={space.id} value={space.id}>
                        {space.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col">
                <label htmlFor="momentId" className="mb-2 text-sm font-medium">
                  Moment 선택
                </label>
                <Select name="momentId" required>
                  <SelectTrigger className="bg-white/50 border-white/20">
                    <SelectValue placeholder="Moment를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {moments.data.map((moment) => (
                      <SelectItem key={moment.id} value={moment.id}>
                        {moment.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="col-span-2">Moment 추가</Button>
            </form>
          </div>

          {/* Space 벌크 생성 폼 */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Space 벌크 생성</h2>
            <form
              action={async (formData: FormData) => {
                "use server";
                const jsonData = formData.get("spacesJson") as string;
                try {
                  const parsed = JSON.parse(jsonData);
                  const parsedResult = z.array(CreateSpace).safeParse(parsed);

                  if (!parsedResult.success) {
                    throw new Error("유효하지 않은 Space 데이터입니다.");
                  }
                  const spaces = parsedResult.data;
                  for (const space of spaces) {
                    await createSpace({
                      ...space,
                      contributors: [user.id],
                      createdAt: new Date().toISOString(),
                    });
                  }
                } catch (error) {
                  console.error("Space 벌크 생성 오류:", error);
                }
              }}
              className="flex flex-col gap-4"
            >
              <Textarea
                name="spacesJson"
                placeholder='[{"title": "Space1", "image": "url", "description": "설명"}, ...]'
                required
                className="h-40 bg-white/50 border-white/20"
              />
              <Button type="submit" className="w-full">Space 벌크 생성</Button>
            </form>
          </div>

          {/* Moment 벌크 생성 폼 */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Moment 벌크 생성</h2>
            <form
              action={async (formData: FormData) => {
                "use server";
                const jsonData = formData.get("momentsJson") as string;
                try {
                  const parsed = JSON.parse(jsonData);
                  const parsedResult = z.array(CreateMoment).safeParse(parsed);

                  if (!parsedResult.success) {
                    throw new Error("유효하지 않은 Moment 데이터입니다.");
                  }

                  const moments = parsedResult.data;

                  for (const moment of moments) {
                    await createMoment({
                      ...moment,
                      author: user.id,
                      createdAt: new Date().toISOString(),
                      modifiedAt: new Date().toISOString(),
                    });
                  }
                } catch (error) {
                  console.error("Moment 벌크 생성 오류:", error);
                }
              }}
              className="flex flex-col gap-4"
            >
              <Textarea
                name="momentsJson"
                placeholder='[{"title": "Moment1", "content": "내용"}, ...]'
                required
                className="h-40 bg-white/50 border-white/20"
              />
              <Button type="submit" className="w-full">Moment 벌크 생성</Button>
            </form>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* 기여 중인 Spaces */}
          <div className={cn(
            "backdrop-blur-lg bg-white/30",
            "border border-white/20",
            "rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]",
            "p-8"
          )}>
            <h2 className="text-xl font-bold mb-6">기여 중인 Spaces</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spaces.data.map((space) => (
                <div key={space.id} className="bg-white/50 rounded-lg p-4">
                  <h3 className="font-semibold">{space.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">{space.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 작성한 Moments */}
          <div className={cn(
            "backdrop-blur-lg bg-white/30",
            "border border-white/20",
            "rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]",
            "p-8"
          )}>
            <h2 className="text-xl font-bold mb-6">작성한 Moments</h2>
            <MomentTimeline moments={moments.data} />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
