"use client";

import * as motion from "framer-motion/client";
import { ArrowLeft, Eye, PenTool, X, Sparkle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { Check } from "lucide-react";

import { HttpStatus } from "@/actions/response";
import { createMoment } from "@/actions/moment/primitives";
import { getSpaces } from "@/actions/space/primitives";
import { addMomentToSpace } from "@/actions/space/moment";
import { AiAction, generateAiText } from "@/actions/ai/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Space } from "@/db/space";
import { Checkbox } from "@/components/ui/checkbox";

// Validation Schemas
const momentSchema = z.object({
  title: z
    .string()
    .min(2, "제목은 2자 이상이어야 합니다")
    .max(100, "제목은 100자 이하여야 합니다"),
  content: z.string().min(10, "내용은 10자 이상이어야 합니다"),
  spaces: z.array(z.string()).min(1, "최소 1개의 Space를 선택해야 합니다"),
});

// Error Alert Component
const ErrorAlert = ({ message }: { message: string }) => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
    <div className="max-w-2xl mx-auto">
      <Alert variant="destructive">
        <AlertTitle>오류</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
        <Link href="/" className="block mt-4">
          <Button variant="outline">홈으로 돌아가기</Button>
        </Link>
      </Alert>
    </div>
  </div>
);

// Space Selector Component
const SpaceSelector = ({
  availableSpaces,
  selectedSpaces,
  setSelectedSpaces,
  errors,
}: {
  availableSpaces: Space[];
  selectedSpaces: Space[];
  setSelectedSpaces: (spaces: Space[]) => void;
  errors: Record<string, string>;
}) => {
  const [open, setOpen] = useState(false);

  const handleSpaceSelect = (space: Space) => {
    setSelectedSpaces(
      selectedSpaces.some((s) => s.id === space.id)
        ? selectedSpaces.filter((s) => s.id !== space.id)
        : [...selectedSpaces, space]
    );
  };

  const handleSpaceRemove = (spaceId: string) => {
    setSelectedSpaces(selectedSpaces.filter((s) => s.id !== spaceId));
  };

  const isSpaceSelected = (spaceId: string) => {
    return selectedSpaces.some((s) => s.id === spaceId);
  };

  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <label className="text-sm font-medium">Space 선택</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            aria-expanded={open}
            className="w-full justify-between bg-white/50 hover:bg-white/60 transition-colors"
          >
            {selectedSpaces.length > 0
              ? `${selectedSpaces.length}개의 Space 선택됨`
              : "Space 선택하기"}
            <Check className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[calc(100vw-2rem)] md:w-[400px] p-0">
          <div className="max-h-[60vh] overflow-y-auto">
            {availableSpaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-gray-500">
                <div className="mb-2">
                  <Check className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-center">Space를 찾을 수 없습니다.</p>
              </div>
            ) : (
              <div className="grid divide-y divide-gray-100">
                {availableSpaces.map((space) => (
                  <div
                    key={space.id}
                    className={cn(
                      "flex items-center px-4 py-3 cursor-pointer transition-all",
                      "hover:bg-gray-50/80 active:bg-gray-100/80",
                      isSpaceSelected(space.id) && "bg-purple-50/80"
                    )}
                    onClick={() => handleSpaceSelect(space)}
                  >
                    <Checkbox
                      checked={isSpaceSelected(space.id)}
                      className="mr-3 h-5 w-5"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm md:text-base">
                        {space.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {errors.spaces && <p className="text-sm text-red-500">{errors.spaces}</p>}
      {selectedSpaces.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedSpaces.map((space) => (
            <Badge
              key={space.id}
              variant="secondary"
              className="flex items-center gap-1 px-3 py-1.5 text-sm"
            >
              {space.title}
              <button
                type="button"
                onClick={() => handleSpaceRemove(space.id)}
                className="ml-1 hover:bg-gray-200/50 rounded-full p-0.5 transition-colors"
                aria-label={`${space.title} 삭제`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// Space 로딩 함수
const useLoadSpaces = (userId: string | undefined) => {
  const [availableSpaces, setAvailableSpaces] = useState<Space[]>([]);

  useEffect(() => {
    const loadSpaces = async () => {
      if (!userId) {
        return;
      }

      try {
        const response = await getSpaces({ contributors: [userId] });
        if (response.status === HttpStatus.OK) {
          setAvailableSpaces(response.data ?? []);
        }
      } catch (error) {
        console.error("Space 로딩 중 오류 발생:", error);
        setAvailableSpaces([]);
      }
    };

    loadSpaces();
  }, [userId]);

  return availableSpaces;
};

export default function NewMomentPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedSpaces, setSelectedSpaces] = useState<Space[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("edit");
  const [isGenerating, setIsGenerating] = useState(false);

  const availableSpaces = useLoadSpaces(session?.user?.id);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <ErrorAlert message="로그인이 필요한 서비스입니다." />;
  }

  const handleAiGenerate = async (target: AiAction) => {
    setIsGenerating(true);
    try {
      const response = await generateAiText(
        target === "title_recommendation" ? title : content,
        target
      );

      if (response) {
        if (target === "title_recommendation") {
          setTitle(response);
        } else {
          setContent(response);
        }
      }
    } catch (error) {
      console.error("AI 텍스트 생성 중 오류 발생:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = momentSchema.parse({
        title,
        content,
        spaces: selectedSpaces.map((space) => space.id),
      });

      // 1. Moment 생성
      const momentResponse = await createMoment({
        title: validatedData.title,
        content: validatedData.content,
        author: session.user.id,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      });

      if (momentResponse.status === HttpStatus.OK) {
        // 2. 선택된 Space들에 Moment 추가
        await Promise.all(
          validatedData.spaces.map((spaceId) =>
            addMomentToSpace(spaceId, momentResponse.data.id)
          )
        );

        router.push(`/moment/${momentResponse.data.id}`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMap: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            errorMap[err.path[0]] = err.message;
          }
        });
        setErrors(errorMap);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <motion.div
        className="max-w-2xl mx-auto space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              돌아가기
            </Button>
          </Link>
          <h1 className="text-xl font-bold">새로운 Moment</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 rounded-full p-1.5 mx-2 md:mx-0 bg-white/10 backdrop-blur-sm shadow-inner">
            {[
              {
                value: "edit",
                icon: <PenTool className="w-4 h-4" />,
                label: "편집",
              },
              {
                value: "preview",
                icon: <Eye className="w-4 h-4" />,
                label: "미리보기",
              },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-full",
                  "focus:outline-none focus:ring-2 focus:ring-violet-500/50",
                  "active:scale-95 transition-all duration-300",
                  activeTab === tab.value
                    ? "bg-gradient-to-r from-violet-500 via-pink-500 to-orange-500 text-white font-medium shadow-lg scale-105"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
                )}
              >
                {tab.icon}
                <span className="text-xs md:text-sm font-medium">
                  {tab.label}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="edit" className="mt-6">
            <motion.div
              className={cn(
                "backdrop-blur-lg bg-white/30",
                "border border-white/20",
                "rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]",
                "p-4 md:p-8"
              )}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Space 선택 */}
                <SpaceSelector
                  availableSpaces={availableSpaces}
                  selectedSpaces={selectedSpaces}
                  setSelectedSpaces={setSelectedSpaces}
                  errors={errors}
                />

                {/* 제목 입력 */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">제목</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-violet-50 border-violet-200 text-violet-600 hover:text-violet-700 transition-colors duration-200"
                      onClick={() => handleAiGenerate("title_recommendation")}
                      disabled={isGenerating}
                    >
                      <Sparkle className="w-3.5 h-3.5" />
                      {isGenerating ? "다듬는 중..." : "다듬기"}
                    </Button>
                  </div>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="제목을 입력해주세요"
                    className="bg-white/50 border-white/20"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title}</p>
                  )}
                </motion.div>

                {/* 내용 입력 */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">내용</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-violet-50 border-violet-200 text-violet-600 hover:text-violet-700 transition-colors duration-200"
                      onClick={() => handleAiGenerate("content_recommendation")}
                      disabled={isGenerating}
                    >
                      <Sparkle className="w-3.5 h-3.5" />
                      {isGenerating ? "다듬는 중..." : "다듬기"}
                    </Button>
                  </div>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="내용을 입력해주세요"
                    className="bg-white/50 border-white/20 min-h-[200px]"
                  />
                  {errors.content && (
                    <p className="text-sm text-red-500">{errors.content}</p>
                  )}
                </motion.div>

                {/* 제출 버튼 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:brightness-110"
                  >
                    Moment 작성하기
                  </Button>
                </motion.div>
              </form>
            </motion.div>
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white/30 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/20"
              >
                <h1 className="text-2xl font-bold mb-4">
                  {title || "제목을 입력해주세요"}
                </h1>
                <div className="prose prose-sm">
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {content || "내용을 입력해주세요"}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
