"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdSave,
  MdArrowBack,
  MdWarning,
  MdDelete,
  MdAdd,
  MdPerson,
  MdAccessTime,
  MdUpdate,
  MdArrowUpward,
  MdArrowDownward,
} from "react-icons/md";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { HttpStatus } from "@/actions/response";
import { authorizeUser } from "@/actions/auth";
import { getMoment, updateMoment } from "@/actions/moment/primitives";
import { getUser } from "@/actions/user";
import { generateAiText } from "@/actions/ai/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import type { User } from "@/db/user";
import {
  Check,
  FileText,
  Languages,
  PenTool,
  Sparkle,
  TextCursor,
  Wand2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Space } from "@/db/space";
import { getSpaces } from "@/actions/space/primitives";
import { addMomentToSpace } from "@/actions/space/moment";
import { removeMomentFromSpace } from "@/actions/space/moment";

// Schemas
const dateSchema = z.coerce.date();

const blockVersionSchema = z.object({
  content: z.string(),
  timestamp: dateSchema,
});

const blockSchema = z.object({
  id: z.string().uuid(),
  versions: z.array(blockVersionSchema),
  selectedVersion: z.number().min(0),
  type: z.literal("paragraph"),
  isProcessing: z.boolean().optional(),
  streamingText: z.string().optional(),
  content: z.string().optional(),
});

const momentSchema = z.object({
  title: z
    .string()
    .min(5, "제목은 5자 이상이어야 합니다")
    .max(100, "제목은 100자 이하여야 합니다"),
  blocks: z
    .array(blockSchema)
    .refine(
      (blocks) =>
        blocks.some((b) => b.versions[b.selectedVersion].content.length > 0),
      "최소 하나의 내용 블록이 필요합니다"
    ),
  spaces: z.array(z.string()).min(1, "최소 하나의 Space를 선택해야 합니다"),
});

type Block = z.infer<typeof blockSchema>;
type BlockVersion = z.infer<typeof blockVersionSchema>;
type Metadata = {
  id: string;
  author: string;
  createdAt: string;
  modifiedAt: string;
}

interface MomentEditPageProps {
  params: Promise<{ id: string }>;
}

// AI Processing Animation Component
const ProcessingAnimation = ({ streamingText }: { streamingText?: string }) => (
  <motion.div
    className="absolute inset-0 rounded-xl overflow-hidden"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      className="absolute inset-0"
      animate={{
        background: [
          "linear-gradient(to right, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3), rgba(239, 68, 68, 0.3))",
          "linear-gradient(to right, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3), rgba(217, 70, 239, 0.3))",
          "linear-gradient(to right, rgba(6, 182, 212, 0.3), rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3))",
        ],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        repeatType: "reverse",
      }}
      style={{ backdropFilter: "blur(8px)" }}
    />
    <ProcessingContent streamingText={streamingText} />
  </motion.div>
);

// Processing Content Component
const ProcessingContent = ({ streamingText }: { streamingText?: string }) => (
  <motion.div
    className="absolute inset-0 flex flex-col items-center justify-center p-4"
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <div className="bg-white/30 backdrop-blur-xl p-4 rounded-xl shadow-xl w-full max-w-full">
      <ProcessingHeader />
      {streamingText && <ProcessingText text={streamingText} />}
    </div>
  </motion.div>
);

// Processing Header Component
const ProcessingHeader = () => (
  <div className="flex items-center gap-3 mb-3">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <Sparkle className="w-[1.25em] h-[1.25em] text-purple-600" />
    </motion.div>
    <span className="text-sm font-medium text-purple-900">
      AI가 글을 수정하고 있습니다...
    </span>
  </div>
);

// Processing Text Component
const ProcessingText = ({ text }: { text: string }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="text-sm text-gray-700 bg-white/50 p-3 rounded-lg"
  >
    {text}
  </motion.div>
);

// Navigation Bar Component
const NavigationBar = ({
  onBack,
  onSubmit,
  isFormDirty,
  isLoading,
}: {
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isFormDirty: boolean;
  isLoading: boolean;
}) => (
  <motion.div
    className="flex justify-between items-center"
    initial={{ y: -20 }}
    animate={{ y: 0 }}
    transition={{ duration: 0.6 }}
  >
    <Button
      variant="ghost"
      onClick={onBack}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-full",
        "backdrop-blur-xl bg-white/10 hover:bg-white/20"
      )}
    >
      <MdArrowBack className="w-[1.25em] h-[1.25em]" />
      돌아가기
    </Button>
    <Button
      onClick={onSubmit}
      disabled={!isFormDirty || isLoading}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-full",
        "bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:bg-gray-400"
      )}
    >
      <MdSave className="w-[1.25em] h-[1.25em]" />
      저장하기
    </Button>
  </motion.div>
);

// Error Alert Component
const ErrorAlert = ({ message }: { message: string }) => (
  <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
    <Alert
      variant="destructive"
      className="max-w-lg backdrop-blur-xl bg-white/30"
    >
      <MdWarning className="h-[1em] w-[1em]" />
      <AlertTitle>오류</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  </div>
);

// Title Input Component
const TitleInput = ({
  title,
  onChange,
  validationErrors,
  onAiRefine,
  isGenerating,
}: {
  title: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validationErrors: z.ZodError | null;
  onAiRefine: () => void;
  isGenerating: boolean;
}) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <Label htmlFor="title" className="text-lg font-semibold tracking-tight">
        제목
      </Label>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-violet-50 border-violet-200 text-violet-600 hover:text-violet-700 transition-colors duration-200"
        onClick={onAiRefine}
        disabled={isGenerating}
      >
        <Sparkle className="w-3.5 h-3.5" />
        {isGenerating ? "다듬는 중..." : "다듬기"}
      </Button>
    </div>
    <div className="relative">
      <Input
        id="title"
        value={title}
        onChange={onChange}
        className={cn(
          "text-xl font-medium p-4",
          "bg-white/50 rounded-xl border-2",
          "focus:bg-white/70 transition-all duration-200", 
          "hover:bg-white/60 hover:border-purple-200/50",
          "focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400",
          "placeholder:text-gray-400/70",
          validationErrors?.errors.some((e) => e.path[0] === "title")
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
            : "border-transparent"
        )}
        placeholder="제목을 입력하세요 (5-100자)"
      />
      <AnimatePresence>
        {validationErrors?.errors
          .filter((e) => e.path[0] === "title")
          .map((error, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute mt-2 text-sm font-medium text-red-500 flex items-center gap-1"
            >
              <MdWarning className="w-4 h-4" />
              {error.message}
            </motion.p>
          ))}
      </AnimatePresence>
    </div>
  </div>
);

// AI Tools Dialog Component
const AiToolsDialog = ({
  isOpen,
  onClose,
  onSelectTool,
  isProcessing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (
    action: "spellcheck" | "summarize" | "rewrite" | "translate" | "elaborate"
  ) => void;
  isProcessing: boolean;
}) => {
  const tools = [
    { action: "spellcheck" as const, icon: Wand2, label: "맞춤법 교정" },
    { action: "summarize" as const, icon: FileText, label: "요약" },
    { action: "rewrite" as const, icon: PenTool, label: "다시 쓰기" },
    { action: "translate" as const, icon: Languages, label: "영어로 번역" },
    { action: "elaborate" as const, icon: TextCursor, label: "자세하게" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>AI 도구 선택</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {tools.map(({ action, icon: Icon, label }) => (
            <Button
              key={action}
              onClick={() => {
                onSelectTool(action);
                onClose();
              }}
              disabled={isProcessing}
              className="w-full justify-start gap-2 text-left"
              variant="outline"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Combined Block Actions Component
const BlockActions = ({
  onAddBlock,
  onDeleteBlock,
  onAiAction,
  onMoveUp,
  onMoveDown,
  blockId,
  isProcessing,
  isFirst,
  isLast,
}: {
  onAddBlock: (id: string) => void;
  onDeleteBlock: (id: string) => void;
  onAiAction: (
    blockId: string,
    action: "spellcheck" | "summarize" | "rewrite" | "translate" | "elaborate"
  ) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  blockId: string;
  isProcessing: boolean;
  isFirst: boolean;
  isLast: boolean;
}) => {
  const [showAiTools, setShowAiTools] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const handleAiClick = () => {
    if (isMobile) {
      setShowAiDialog(true);
    } else {
      setShowAiTools(!showAiTools);
    }
  };

  const tools = [
    { action: "spellcheck" as const, icon: Wand2, label: "맞춤법 교정" },
    { action: "summarize" as const, icon: FileText, label: "요약" },
    { action: "rewrite" as const, icon: PenTool, label: "다시 쓰기" },
    { action: "translate" as const, icon: Languages, label: "영어로 번역" },
    { action: "elaborate" as const, icon: TextCursor, label: "자세하게" },
  ];

  return (
    <>
      <motion.div className="absolute left-1/2 -translate-x-1/2 -bottom-8 w-full max-w-[95vw] md:max-w-none flex items-center justify-center z-10">
        <motion.div
          className={cn(
            "flex items-center gap-1.5 md:gap-2 backdrop-blur-md bg-white/50 rounded-full p-1.5",
            "opacity-0 group-hover:opacity-100 transition-all shadow-lg border border-white/30",
            "w-auto mx-auto"
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAiClick}
            className={cn(
              "hover:bg-white/60 rounded-full p-1.5 md:p-2",
              showAiTools && "bg-purple-100"
            )}
          >
            <Sparkle className="w-[1em] h-[1em] md:w-[1.25em] md:h-[1.25em] text-purple-600/70 hover:text-purple-600" />
          </Button>

          <AnimatePresence>
            {!isMobile && showAiTools && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex items-center gap-1.5 md:gap-2 overflow-hidden"
              >
                {tools.map(({ action, icon: Icon, label }) => (
                  <Button
                    key={action}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="hover:bg-white/60 rounded-full px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium whitespace-nowrap"
                    onClick={() => onAiAction(blockId, action)}
                    disabled={isProcessing}
                  >
                    <Icon className="w-[1em] h-[1em] mr-1 md:mr-1.5" />
                    {label}
                  </Button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {!isFirst && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onMoveUp(blockId)}
              className="hover:bg-white/60 rounded-full p-1.5 md:p-2"
            >
              <MdArrowUpward className="w-[1em] h-[1em] md:w-[1.25em] md:h-[1.25em] text-gray-600/70 hover:text-gray-600" />
            </Button>
          )}
          {!isLast && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onMoveDown(blockId)}
              className="hover:bg-white/60 rounded-full p-1.5 md:p-2"
            >
              <MdArrowDownward className="w-[1em] h-[1em] md:w-[1.25em] md:h-[1.25em] text-gray-600/70 hover:text-gray-600" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onAddBlock(blockId)}
            className="hover:bg-white/60 rounded-full p-1.5 md:p-2"
          >
            <MdAdd className="w-[1em] h-[1em] md:w-[1.25em] md:h-[1.25em] text-gray-600/70 hover:text-gray-600" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDeleteBlock(blockId)}
            className="hover:bg-white/60 rounded-full p-1.5 md:p-2"
          >
            <MdDelete className="w-[1em] h-[1em] md:w-[1.25em] md:h-[1.25em] text-gray-600/70 hover:text-gray-600" />
          </Button>
        </motion.div>
      </motion.div>

      <AiToolsDialog
        isOpen={showAiDialog}
        onClose={() => setShowAiDialog(false)}
        onSelectTool={(action) => onAiAction(blockId, action)}
        isProcessing={isProcessing}
      />
    </>
  );
};

// Version Selector Component
const VersionSelector = ({
  versions,
  selectedVersion,
  onVersionSelect,
  blockId,
}: {
  versions: BlockVersion[];
  selectedVersion: number;
  onVersionSelect: (blockId: string, index: number) => void;
  blockId: string;
}) => (
  <div className="mb-4 overflow-x-auto scrollbar scrollbar-hide whitespace-nowrap">
    <div className="inline-flex gap-2 pb-2">
      {versions.map((version, index) => (
        <Button
          key={index}
          type="button"
          variant={selectedVersion === index ? "default" : "outline"}
          size="sm"
          onClick={() => onVersionSelect(blockId, index)}
          className={cn(
            "text-sm",
            selectedVersion === index
              ? "bg-purple-500 text-white"
              : "bg-white/50"
          )}
        >
          {index === 0 ? "원본" : `V${index + 1}`}
        </Button>
      ))}
    </div>
  </div>
);

// Metadata Badges Component
const MetadataBadges = ({
  authorInfo,
  metadata,
}: {
  authorInfo: User | null;
  metadata: Metadata;
}) => (
  <div className="pt-6 border-t border-white/30">
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="secondary" className="flex items-center gap-1">
        <MdPerson className="w-[1em] h-[1em]" />
        {authorInfo?.name || metadata.author}
      </Badge>
      <Badge variant="secondary" className="flex items-center gap-1">
        <MdAccessTime className="w-[1em] h-[1em]" />
        작성: {metadata.createdAt}
      </Badge>
      <Badge variant="secondary" className="flex items-center gap-1">
        <MdUpdate className="w-[1em] h-[1em]" />
        수정: {formatDate(metadata.modifiedAt)}
      </Badge>
    </div>
  </div>
);

export default function MomentEditPage({ params }: MomentEditPageProps) {
  const router = useRouter();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<Metadata>({
    id: "",
    author: "",
    createdAt: "",
    modifiedAt: "",
  });
  const [authorInfo, setAuthorInfo] = useState<User | null>(null);
  const [validationErrors, setValidationErrors] = useState<z.ZodError | null>(
    null
  );
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [availableSpaces, setAvailableSpaces] = useState<Space[]>([]);
  const [selectedSpaces, setSelectedSpaces] = useState<Space[]>([]);
  const [open, setOpen] = useState(false);
  const [isTitleAiRefining, setIsTitleAiRefining] = useState(false);

  // Handlers and Effects
  useEffect(() => {
    const loadMoment = async () => {
      try {
        const { id } = await params;
        const [authResult, momentResult, spacesResult] = await Promise.all([
          authorizeUser(),
          getMoment({ id }),
          getSpaces({}), // 모든 Space 로드
        ]);

        if (authResult.status !== HttpStatus.OK) {
          setError("권한이 없습니다. 로그인이 필요합니다.");
          return;
        }

        if (momentResult.status !== HttpStatus.OK) {
          setError("Moment를 찾을 수 없습니다.");
          return;
        }

        if (momentResult.data.author !== authResult.data.id) {
          setError("이 Moment를 수정할 권한이 없습니다.");
          return;
        }

        const {
          title,
          content,
          id: momentId,
          author,
          createdAt,
          modifiedAt,
        } = momentResult.data;

        const authorResult = await getUser(author);
        if (authorResult.status === HttpStatus.OK) {
          setAuthorInfo(authorResult.data);
        }

        setTitle(title);
        setBlocks(
          content.split("\n\n").map((content) => ({
            id: uuidv4(),
            versions: [
              { content, timestamp: new Date(), isAiGenerated: false },
            ],
            selectedVersion: 0,
            type: "paragraph" as const,
          }))
        );
        setMetadata({
          id: momentId,
          author,
          createdAt: formatDate(createdAt),
          modifiedAt: formatDate(modifiedAt),
        });

        if (spacesResult.status === HttpStatus.OK) {
          setAvailableSpaces(spacesResult.data);
          // 현재 Moment가 포함된 Space들 선택
          const momentSpaces = spacesResult.data.filter((space) =>
            space.moments.includes(id)
          );
          setSelectedSpaces(momentSpaces);
        }
      } catch {
        setError("페이지를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadMoment();
  }, [params]);

  const validateForm = () => {
    try {
      momentSchema.parse({
        title,
        blocks,
        spaces: selectedSpaces.map((s) => s.id),
      });
      setValidationErrors(null);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationErrors(error);
      }
      return false;
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsFormDirty(true);
  };

  const handleBlockChange = (id: string, content: string) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === id
          ? {
              ...block,
              content,
              versions: [
                ...block.versions.slice(0, block.selectedVersion),
                { content, timestamp: new Date() },
                ...block.versions.slice(block.selectedVersion + 1),
              ],
            }
          : block
      )
    );
    setIsFormDirty(true);
  };

  const handleVersionSelect = (blockId: string, versionIndex: number) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? { ...block, selectedVersion: versionIndex }
          : block
      )
    );
    setIsFormDirty(true);

    // Version 변경 후 textarea 높이 조정
    setTimeout(() => {
      const textarea = document.querySelector(
        `textarea[data-block-id="${blockId}"]`
      ) as HTMLTextAreaElement;
      if (textarea) {
        adjustTextareaHeight(textarea);
      }
    }, 0);
  };

  const handleAddBlock = (id: string) => {
    const newBlock = blockSchema.parse({
      id: uuidv4(),
      versions: [{ content: "", timestamp: new Date(), isAiGenerated: false }],
      selectedVersion: 0,
      type: "paragraph",
    });

    setBlocks((prev) => {
      const index = prev.findIndex((block) => block.id === id);
      return [...prev.slice(0, index + 1), newBlock, ...prev.slice(index + 1)];
    });
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
    setIsFormDirty(true);
  };

  const handleMoveUp = (id: string) => {
    setBlocks((prev) => {
      const index = prev.findIndex((block) => block.id === id);
      if (index <= 0) return prev;

      const newBlocks = [...prev];
      [newBlocks[index - 1], newBlocks[index]] = [
        newBlocks[index],
        newBlocks[index - 1],
      ];
      return newBlocks;
    });
    setIsFormDirty(true);
  };

  const handleMoveDown = (id: string) => {
    setBlocks((prev) => {
      const index = prev.findIndex((block) => block.id === id);
      if (index === -1 || index === prev.length - 1) return prev;

      const newBlocks = [...prev];
      [newBlocks[index], newBlocks[index + 1]] = [
        newBlocks[index + 1],
        newBlocks[index],
      ];
      return newBlocks;
    });
    setIsFormDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      // 1. Moment 내용 업데이트
      const updateResult = await updateMoment({
        ...metadata,
        title,
        content: blocks
          .map((b) => b.versions[b.selectedVersion].content)
          .join("\n\n"),
        modifiedAt: new Date().toISOString(),
      });

      if (updateResult.status !== HttpStatus.OK) {
        setError(
          updateResult.errorMessages?.[0] || "수정 중 오류가 발생했습니다."
        );
        return;
      }

      // 2. Space 관계 업데이트
      const currentSpaceIds = selectedSpaces.map((s) => s.id);
      const previousSpaceIds = availableSpaces
        .filter((space) => space.moments.includes(metadata.id))
        .map((space) => space.id);

      // 제거된 Space에서 Moment 제거
      const removedSpaceIds = previousSpaceIds.filter(
        (id) => !currentSpaceIds.includes(id)
      );
      for (const spaceId of removedSpaceIds) {
        await removeMomentFromSpace(spaceId, metadata.id);
      }

      // 새로 추가된 Space에 Moment 추가
      const addedSpaceIds = currentSpaceIds.filter(
        (id) => !previousSpaceIds.includes(id)
      );
      for (const spaceId of addedSpaceIds) {
        await addMomentToSpace(spaceId, metadata.id);
      }

      router.back();
    } catch {
      setError("예기치 못한 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "0px";
    textarea.style.height = textarea.scrollHeight + "px";
  };

  const handleAiAction = async (
    blockId: string,
    action: "spellcheck" | "summarize" | "rewrite" | "translate" | "elaborate"
  ) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;

    try {
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === blockId ? { ...b, isProcessing: true, streamingText: "" } : b
        )
      );

      const stream = await generateAiText(
        block.versions[block.selectedVersion].content,
        action
      );
      let fullText = "";

      for await (const chunk of stream) {
        fullText += chunk;
        setBlocks((prev) =>
          prev.map((b) =>
            b.id === blockId ? { ...b, streamingText: fullText } : b
          )
        );
      }

      setBlocks((prev) =>
        prev.map((b) =>
          b.id === blockId
            ? {
                ...b,
                versions: [
                  ...b.versions,
                  {
                    content: fullText,
                    timestamp: new Date(),
                    isAiGenerated: true,
                  },
                ],
                selectedVersion: b.versions.length,
                isProcessing: false,
                streamingText: undefined,
              }
            : b
        )
      );
      setIsFormDirty(true);

      setTimeout(() => {
        const textarea = document.querySelector(
          `textarea[data-block-id="${blockId}"]`
        ) as HTMLTextAreaElement;
        if (textarea) {
          adjustTextareaHeight(textarea);
        }
      }, 0);
    } catch (error) {
      console.error("AI 처리 중 오류:", error);
      setError("AI 처리 중 오류가 발생했습니다.");

      setBlocks((prev) =>
        prev.map((b) =>
          b.id === blockId
            ? {
                ...b,
                isProcessing: false,
                streamingText: undefined,
              }
            : b
        )
      );
    }
  };

  const handleSpaceSelect = (space: Space) => {
    const newSelectedSpaces = selectedSpaces.some((s) => s.id === space.id)
      ? selectedSpaces.filter((s) => s.id !== space.id)
      : [...selectedSpaces, space];

    setSelectedSpaces(newSelectedSpaces);

    // Space 변경 시 Dirty Check
    const originalSpaceIds = availableSpaces
      .filter((space) => space.moments.includes(metadata.id))
      .map((space) => space.id);

    const currentSpaceIds = newSelectedSpaces.map((s) => s.id);
    const isDirty =
      !originalSpaceIds.every((id) => currentSpaceIds.includes(id)) ||
      !currentSpaceIds.every((id) => originalSpaceIds.includes(id));

    setIsFormDirty(isDirty);
  };

  const handleTitleAiRefine = async () => {
    if (!title.trim()) return;
    
    try {
      setIsTitleAiRefining(true);
      
      const refinedTitle = await generateAiText(
        title,
        "title_recommendation"
      );
      
      setTitle(refinedTitle);
      setIsFormDirty(true);
      
    } catch (error) {
      console.error("제목 다듬기 중 오류:", error);
      setError("제목 다듬기 중 오류가 발생했습니다.");
    } finally {
      setIsTitleAiRefining(false);
    }
  };

  if (error) {
    return <ErrorAlert message={error} />;
  }

  return (
    <motion.div
      className="min-h-screen p-4 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div className="max-w-4xl mx-auto space-y-8">
        <NavigationBar
          onBack={() => router.back()}
          onSubmit={handleSubmit}
          isFormDirty={isFormDirty}
          isLoading={isLoading}
        />

        <motion.form
          className="space-y-8"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className={cn(
              "p-4 md:p-8 rounded-2xl space-y-8",
              "backdrop-blur-xl bg-white/30"
            )}
          >
            <TitleInput
              title={title}
              onChange={handleTitleChange}
              validationErrors={validationErrors}
              onAiRefine={handleTitleAiRefine}
              isGenerating={isTitleAiRefining}
            />

            <motion.div className="space-y-2">
              <Label className="text-lg font-semibold">Space 관리</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-between bg-white/50 hover:bg-white/60",
                      validationErrors?.errors.some(
                        (e) => e.path[0] === "spaces"
                      ) &&
                        "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                    )}
                  >
                    {selectedSpaces.length > 0
                      ? `${selectedSpaces.length}개의 Space에 포함됨`
                      : "Space 선택하기"}
                    <Check className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <div className="max-h-[300px] overflow-y-auto">
                    <div className="grid divide-y divide-gray-100">
                      {availableSpaces.map((space) => (
                        <div
                          key={space.id}
                          className={cn(
                            "flex items-center px-4 py-3 cursor-pointer transition-all",
                            "hover:bg-gray-50/80",
                            selectedSpaces.some((s) => s.id === space.id) &&
                              "bg-purple-50/80"
                          )}
                          onClick={() => handleSpaceSelect(space)}
                        >
                          <Checkbox
                            checked={selectedSpaces.some(
                              (s) => s.id === space.id
                            )}
                            className="mr-3 h-5 w-5"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{space.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {validationErrors?.errors
                .filter((e) => e.path[0] === "spaces")
                .map((error, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-sm text-red-500 flex items-center gap-1"
                  >
                    <MdWarning className="w-4 h-4" />
                    {error.message}
                  </motion.p>
                ))}
              {selectedSpaces.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedSpaces.map((space) => (
                    <Badge
                      key={space.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {space.title}
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>

            <div className="space-y-3">
              <Label className="text-lg font-semibold">내용</Label>
              <div className="space-y-6">
                {blocks.map((block, index) => (
                  <motion.div
                    key={block.id}
                    className={cn(
                      "group relative p-2 md:p-4 rounded-xl w-full",
                      "bg-white/40 hover:bg-white/50 transition-all duration-200",
                      "border border-transparent hover:border-purple-200/50",
                      focusedBlockId === block.id && "ring-2 ring-purple-500/50"
                    )}
                  >
                    {block.versions.length > 1 && (
                      <VersionSelector
                        versions={block.versions}
                        selectedVersion={block.selectedVersion}
                        onVersionSelect={handleVersionSelect}
                        blockId={block.id}
                      />
                    )}
                    <div className="flex items-start gap-4 w-full">
                      <div className="flex-grow relative">
                        <motion.textarea
                          value={block.versions[block.selectedVersion].content}
                          onChange={(e) => {
                            handleBlockChange(block.id, e.target.value);
                            adjustTextareaHeight(e.target);
                          }}
                          onFocus={() => setFocusedBlockId(block.id)}
                          className="w-full bg-transparent outline-none resize-none focus:ring-0 text-gray-700 placeholder-gray-400 overflow-hidden p-0"
                          placeholder="내용을 입력하세요..."
                          data-block-id={block.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                        <AnimatePresence>
                          {block.isProcessing && (
                            <ProcessingAnimation
                              streamingText={block.streamingText}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <BlockActions
                      onAddBlock={handleAddBlock}
                      onDeleteBlock={handleDeleteBlock}
                      onAiAction={handleAiAction}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      blockId={block.id}
                      isProcessing={block.isProcessing || false}
                      isFirst={index === 0}
                      isLast={index === blocks.length - 1}
                    />
                  </motion.div>
                ))}
              </div>
              {validationErrors?.errors
                .filter((e) => e.path[0] === "blocks")
                .map((error, i) => (
                  <p key={i} className="text-sm text-red-500">
                    {error.message}
                  </p>
                ))}
            </div>

            <MetadataBadges authorInfo={authorInfo} metadata={metadata} />
          </motion.div>
        </motion.form>
      </motion.div>
    </motion.div>
  );
}
