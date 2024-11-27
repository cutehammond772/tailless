"use client";

import * as motion from "framer-motion/client";
import { ArrowLeft, Image as ImageIcon, Tags, Users, X, Eye, PenTool, BookOpen, Lightbulb, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { useSession } from "next-auth/react";

import { HttpStatus } from "@/actions/response";
import { createSpace } from "@/actions/space/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout } from "@/db/layout";

// Validation Schemas
const spaceSchema = z.object({
  title: z
    .string()
    .min(2, "제목은 2자 이상이어야 합니다")
    .max(100, "제목은 100자 이하여야 합니다"),
  image: z.string().url("올바른 URL을 입력해주세요").optional(),
  description: z
    .string()
    .min(10, "설명은 10자 이상이어야 합니다")
    .max(1000, "설명은 1000자 이하여야 합니다"),
  tags: z
    .array(z.string())
    .min(1, "최소 1개의 태그가 필요합니다")
    .max(10, "태그는 최대 10개까지 가능합니다"),
  layout: Layout,
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

// Preview Component
const SpacePreview = ({ title, description, image, tags, userName }: { 
  title: string;
  description: string;
  image: string;
  tags: string[];
  userName: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
    className="group relative aspect-[4/5] rounded-xl md:rounded-2xl overflow-hidden shadow-xl"
  >
    <motion.div
      className="absolute inset-0 bg-cover bg-center"
      style={{
        backgroundImage: `url(${image || '/placeholder-image.jpg'})`,
      }}
    />
    <motion.div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
    <motion.div className="absolute inset-0 flex flex-col justify-end p-6 md:p-6 lg:p-8">
      <motion.div className="space-y-4">
        <motion.div className="space-y-2">
          <motion.h1 className="text-2xl md:text-2xl lg:text-3xl font-bold text-white">
            {title || "제목을 입력해주세요"}
          </motion.h1>
          <motion.p className="text-sm md:text-sm lg:text-base text-white/80 line-clamp-2">
            {description || "설명을 입력해주세요"}
          </motion.p>
        </motion.div>
        <motion.div className="space-y-3">
          <motion.div className="flex items-center gap-2">
            <Tags className="w-4 h-4 text-white/80" />
            <motion.div className="flex gap-2 flex-wrap">
              {tags.length > 0 ? tags.map((tag) => (
                <Badge
                  key={tag}
                  className="bg-white/20 hover:bg-white/30 text-white border-none text-xs"
                >
                  {tag}
                </Badge>
              )) : (
                <Badge className="bg-white/20 text-white border-none text-xs">
                  태그를 추가해주세요
                </Badge>
              )}
            </motion.div>
          </motion.div>
          <motion.div className="flex items-center gap-2 text-white/80">
            <Users className="w-4 h-4" />
            <motion.p className="text-sm">
              {userName}
            </motion.p>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  </motion.div>
);

export default function NewSpacePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("edit");
  const [layout, setLayout] = useState<z.infer<typeof Layout>>("blog");

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <ErrorAlert message="로그인이 필요한 서비스입니다." />;
  }

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = spaceSchema.parse({
        title,
        image: image || undefined,
        description,
        tags,
        layout,
      });

      const response = await createSpace({
        ...validatedData,
        contributors: [session.user.id],
        createdAt: new Date().toISOString(),
      });

      if (response.status === HttpStatus.OK) {
        router.push(`/space/${response.data.id}`);
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
          <h1 className="text-xl font-bold">새로운 Space</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4 md:mt-8">
          <TabsList className="grid grid-cols-2 rounded-full p-1.5 mx-2 md:mx-0 bg-white/10 backdrop-blur-sm shadow-inner">
            {[
              { value: "edit", icon: <PenTool className="w-4 h-4" />, label: "편집" },
              { value: "preview", icon: <Eye className="w-4 h-4" />, label: "미리보기" }
            ].map(tab => (
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
                <span className="text-xs md:text-sm font-medium">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="edit" className="mt-6 md:mt-8">
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
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                {/* 제목 입력 */}
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="text-sm font-medium">Space 제목</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="멋진 제목을 입력해주세요"
                    className="bg-white/50 border-white/20"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title}</p>
                  )}
                </motion.div>

                {/* 이미지 URL 입력 */}
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="text-sm font-medium flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    커버 이미지
                  </label>
                  <Input
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    type="url"
                    placeholder="이미지 URL을 입력해주세요"
                    className="bg-white/50 border-white/20"
                  />
                  {errors.image && (
                    <p className="text-sm text-red-500">{errors.image}</p>
                  )}
                </motion.div>

                {/* 설명 입력 */}
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="text-sm font-medium">Space 설명</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Space에 대한 설명을 입력해주세요"
                    className="bg-white/50 border-white/20 min-h-[100px]"
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description}</p>
                  )}
                </motion.div>

                {/* 태그 입력 */}
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Tags className="w-4 h-4" />
                    태그
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="태그를 입력하고 Enter를 누르세요"
                      className="bg-white/50 border-white/20"
                    />
                    <Button
                      type="button"
                      onClick={handleAddTag}
                      variant="secondary"
                    >
                      추가
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  {errors.tags && (
                    <p className="text-sm text-red-500">{errors.tags}</p>
                  )}
                </motion.div>

                {/* 레이아웃 선택 */}
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <label className="text-sm font-medium">레이아웃 선택</label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: "blog", icon: <BookOpen className="w-5 h-5" />, label: "블로그", description: "글 중심의 레이아웃" },
                      { value: "idea", icon: <Lightbulb className="w-5 h-5" />, label: "아이디어", description: "카드형 레이아웃" },
                      { value: "timeline", icon: <Clock className="w-5 h-5" />, label: "타임라인", description: "시간순 레이아웃" }
                    ].map((layoutOption) => (
                      <motion.div
                        key={layoutOption.value}
                        className={cn(
                          "p-4 rounded-xl cursor-pointer transition-all duration-200",
                          "border-2",
                          layout === layoutOption.value
                            ? "border-violet-500 bg-gradient-to-r from-violet-500 via-pink-500 to-orange-500 text-white"
                            : "border-transparent bg-white/50 hover:bg-white/80"
                        )}
                        onClick={() => setLayout(layoutOption.value as z.infer<typeof Layout>)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex flex-col items-center text-center gap-2">
                          {layoutOption.icon}
                          <h3 className="font-medium">{layoutOption.label}</h3>
                          <p className={cn(
                            "text-xs",
                            layout === layoutOption.value ? "text-white/80" : "text-gray-500"
                          )}>{layoutOption.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* 기여자 정보 */}
                <motion.div 
                  className="flex items-center gap-2 text-sm text-gray-600"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Users className="w-4 h-4" />
                  <span>기여자: {session.user.name}</span>
                </motion.div>

                {/* 제출 버튼 */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:brightness-110"
                  >
                    Space 만들기
                  </Button>
                </motion.div>
              </form>
            </motion.div>
          </TabsContent>

          <TabsContent value="preview" className="mt-6 md:mt-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SpacePreview
                title={title}
                description={description}
                image={image}
                tags={tags}
                userName={session.user.name ?? ""}
              />
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}