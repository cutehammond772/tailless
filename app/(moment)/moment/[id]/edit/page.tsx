"use client";

import { useEffect, useRef, useState } from "react";
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
import { Space } from "@/db/space";
import { getSpaces } from "@/actions/space/primitives";
import { addMomentToSpace } from "@/actions/space/moment";
import { removeMomentFromSpace } from "@/actions/space/moment";
import { generate } from "@/actions/ai/text";
import {
  elaborate,
  rewrite,
  spellCheck,
  titleRefinement,
  summarize,
  translate,
} from "@/features/writing/action";

// Schemas
const BlockVersion = z.object({
  content: z.string(),
  timestamp: z.coerce.date(),
});

const Block = z.object({
  id: z.string().uuid(),
  versions: z.array(BlockVersion),
  selectedVersion: z.number().min(0),
  type: z.literal("paragraph"),
  isProcessing: z.boolean().optional(),
  streamingText: z.string().optional(),
  content: z.string().optional(),
});

const Moment = z.object({
  title: z
    .string()
    .min(2, "제목은 2자 이상이어야 합니다")
    .max(100, "제목은 100자 이하여야 합니다"),
  blocks: z
    .array(Block)
    .refine(
      (blocks) =>
        blocks.some((b) => b.versions[b.selectedVersion].content.length > 0),
      "최소 하나의 내용 블록이 필요합니다"
    ),
  spaces: z.array(z.string()).min(1, "최소 하나의 Space를 선택해야 합니다"),
});

type Block = z.infer<typeof Block>;
type BlockVersion = z.infer<typeof BlockVersion>;
type Metadata = {
  id: string;
  author: string;
  createdAt: string;
  modifiedAt: string;
};

interface MomentEditPageProps {
  params: Promise<{ id: string }>;
}

const AiProcessing = ({ streamingText }: { streamingText?: string }) => (
  <motion.div
    className="absolute inset-0 rounded-xl overflow-hidden"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-xl" />

    <motion.div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-pink-600/20" />

    <motion.div className="relative z-10 h-full flex items-center justify-center p-6">
      <motion.div
        className="max-w-lg w-full bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div className="p-6 border-b border-white/10">
          <motion.div className="flex items-center gap-3">
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <motion.div>
                <Sparkle className="w-6 h-6 text-purple-400" />
              </motion.div>
            </motion.div>
            <motion.h3 className="text-lg font-semibold text-white">
              AI가 글을 수정하고 있습니다
            </motion.h3>
          </motion.div>
        </motion.div>

        {streamingText && (
          <motion.div
            className="p-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="text-white/90 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10"
              style={{
                textShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              {streamingText}
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  </motion.div>
);

interface NavigationBarProps {
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isFormDirty: boolean;
  isLoading: boolean;
}

const NavigationBar = ({
  onBack,
  onSubmit,
  isFormDirty,
  isLoading,
}: NavigationBarProps) => (
  <motion.div
    className="flex justify-between items-center"
    initial={{ y: -20 }}
    animate={{ y: 0 }}
    transition={{ duration: 0.6 }}
  >
    <motion.button
      type="button"
      onClick={onBack}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-full",
        "backdrop-blur-xl bg-white/10"
      )}
      whileHover={{
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        scale: 1.02,
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <MdArrowBack className="w-[1.25em] h-[1.25em]" />
      돌아가기
    </motion.button>

    <motion.button
      type="button"
      onClick={onSubmit}
      disabled={!isFormDirty || isLoading}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-full",
        "bg-blue-600 text-white",
        (!isFormDirty || isLoading) && "bg-gray-400 cursor-not-allowed"
      )}
      whileHover={
        !isFormDirty || isLoading
          ? {}
          : {
              backgroundColor: "#2563eb", // blue-700
              scale: 1.02,
            }
      }
      whileTap={!isFormDirty || isLoading ? {} : { scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <MdSave className="w-[1.25em] h-[1.25em]" />
      저장하기
    </motion.button>
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
}) => {
  const hasError = validationErrors?.errors.some((e) => e.path[0] === "title");
  const titleErrors = validationErrors?.errors.filter(
    (e) => e.path[0] === "title"
  );

  return (
    <>
      <motion.div
        className="flex items-center justify-between mb-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Label
          htmlFor="title"
          className="text-lg font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600"
        >
          제목
        </Label>
        <motion.button
          type="button"
          onClick={onAiRefine}
          disabled={isGenerating}
          className={cn(
            "relative overflow-hidden rounded-full backdrop-blur-lg",
            "flex items-center gap-1.5 px-3 py-1.5",
            "text-xs font-medium text-violet-700",
            "bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)]",
            isGenerating && "cursor-not-allowed opacity-70"
          )}
          whileHover={!isGenerating ? { scale: 1.05 } : {}}
          whileTap={!isGenerating ? { scale: 0.95 } : {}}
        >
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "linear-gradient(45deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))",
                "linear-gradient(45deg, rgba(236, 72, 153, 0.2), rgba(139, 92, 246, 0.2))",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          <motion.div className="relative flex items-center gap-1.5">
            <motion.div
              animate={isGenerating ? { rotate: 360 } : {}}
              transition={{
                duration: 2,
                repeat: isGenerating ? Infinity : 0,
                ease: "linear",
              }}
            >
              <Sparkle className="w-3.5 h-3.5" />
            </motion.div>
            {isGenerating ? "다듬는 중..." : "다듬기"}
          </motion.div>
        </motion.button>
      </motion.div>
      <motion.div
        className="relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <motion.div
          animate={hasError ? { x: [0, -4, 4, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <Input
            id="title"
            value={title}
            onChange={onChange}
            className={cn(
              "w-full text-xl font-medium p-4",
              "bg-white/10 backdrop-blur-md rounded-xl",
              "border border-white/20",
              "transition-all duration-300",
              "hover:bg-white/20",
              "focus:bg-white/25 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400/50",
              "placeholder:text-white/40",
              hasError &&
                "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30"
            )}
            placeholder="제목을 입력하세요 (5-100자)"
            style={{ textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
          />
        </motion.div>

        <AnimatePresence mode="wait">
          {titleErrors?.map((error, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute mt-2 px-4 py-2 rounded-lg backdrop-blur-md"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
            >
              <motion.p className="flex items-center gap-2 text-sm font-medium text-red-500">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <MdWarning className="w-4 h-4" />
                </motion.div>
                {error.message}
              </motion.p>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

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
            <motion.button
              type="button"
              key={action}
              onClick={() => {
                onSelectTool(action);
                onClose();
              }}
              disabled={isProcessing}
              className={cn(
                "w-full px-4 py-2 flex items-center gap-2",
                "bg-white/10 backdrop-blur-md",
                "border border-white/20",
                "rounded-lg text-left",
                "transition-colors duration-200",
                "hover:bg-white/20",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </motion.button>
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
  isFocused,
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
  isFocused: boolean;
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
            "shadow-lg border border-white/30",
            "w-auto mx-auto",
            isMobile
              ? cn(
                  "opacity-0 transition-opacity duration-200",
                  isFocused && "opacity-100"
                )
              : "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          )}
        >
          <motion.button
            type="button"
            onClick={handleAiClick}
            className={cn(
              "hover:bg-white/60 rounded-full p-1.5 md:p-2",
              showAiTools && "bg-purple-100"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkle className="w-[1em] h-[1em] md:w-[1.25em] md:h-[1.25em] text-purple-600/70 hover:text-purple-600" />
          </motion.button>

          <AnimatePresence>
            {!isMobile && showAiTools && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex items-center gap-1.5 md:gap-2 overflow-hidden"
              >
                {tools.map(({ action, icon: Icon, label }) => (
                  <motion.button
                    key={action}
                    type="button"
                    className="hover:bg-white/60 rounded-full px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm font-medium whitespace-nowrap flex items-center"
                    onClick={() => onAiAction(blockId, action)}
                    disabled={isProcessing}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-[1em] h-[1em] mr-1 md:mr-1.5 inline-block" />
                    <span className="inline-block">{label}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {!isFirst && (
            <motion.button
              type="button"
              onClick={() => onMoveUp(blockId)}
              className="hover:bg-white/60 rounded-full p-1.5 md:p-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MdArrowUpward className="w-[1em] h-[1em] md:w-[1.25em] md:h-[1.25em] text-gray-600/70 hover:text-gray-600" />
            </motion.button>
          )}
          {!isLast && (
            <motion.button
              type="button"
              onClick={() => onMoveDown(blockId)}
              className="hover:bg-white/60 rounded-full p-1.5 md:p-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MdArrowDownward className="w-[1em] h-[1em] md:w-[1.25em] md:h-[1.25em] text-gray-600/70 hover:text-gray-600" />
            </motion.button>
          )}
          <motion.button
            type="button"
            onClick={() => onAddBlock(blockId)}
            className="hover:bg-white/60 rounded-full p-1.5 md:p-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MdAdd className="w-[1em] h-[1em] md:w-[1.25em] md:h-[1.25em] text-gray-600/70 hover:text-gray-600" />
          </motion.button>
          <motion.button
            type="button"
            onClick={() => onDeleteBlock(blockId)}
            className="hover:bg-white/60 rounded-full p-1.5 md:p-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MdDelete className="w-[1em] h-[1em] md:w-[1.25em] md:h-[1.25em] text-gray-600/70 hover:text-gray-600" />
          </motion.button>
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
  <motion.div
    className="overflow-x-auto scrollbar scrollbar-hide whitespace-nowrap"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <motion.div
      className="inline-flex gap-2 pb-2 px-1"
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      {versions.map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.button
            type="button"
            onClick={() => onVersionSelect(blockId, index)}
            className={cn(
              "relative text-sm px-4 py-2 rounded-xl",
              "backdrop-blur-md transition-all duration-300",
              "outline-none focus:outline-none",
              selectedVersion === index
                ? "bg-purple-500/20 text-purple-700 border border-purple-400/30"
                : "bg-white/10 hover:bg-white/20 text-gray-700 border border-white/20",
              "shadow-lg hover:shadow-xl"
            )}
            whileHover={{
              backgroundColor:
                selectedVersion === index
                  ? "rgba(168, 85, 247, 0.25)"
                  : "rgba(255, 255, 255, 0.25)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 rounded-xl -z-10"
              initial={false}
              animate={{
                background:
                  selectedVersion === index
                    ? "linear-gradient(to right, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))"
                    : "linear-gradient(to right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.1))",
              }}
              transition={{ duration: 0.3 }}
            />
            <motion.span
              animate={
                selectedVersion === index
                  ? {
                      textShadow: [
                        "0 0 0px rgba(147, 51, 234, 0)",
                        "0 0 10px rgba(147, 51, 234, 0.3)",
                        "0 0 0px rgba(147, 51, 234, 0)",
                      ],
                    }
                  : {}
              }
              transition={{ duration: 2, repeat: Infinity }}
            >
              {index === 0 ? "원본" : `V${index + 1}`}
            </motion.span>
          </motion.button>
        </motion.div>
      ))}
    </motion.div>
  </motion.div>
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

// BlockContent Component
const BlockContent = ({
  content,
  onChange,
  onFocus,
  blockId,
}: {
  content: string;
  onChange: (content: string) => void;
  onFocus: () => void;
  blockId: string;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight(textareaRef.current);
    }
  }, [content]);

  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight(textareaRef.current);
    }
  }, []);

  return (
    <motion.textarea
      ref={textareaRef}
      value={content}
      onChange={(e) => {
        onChange(e.target.value);
        adjustTextareaHeight(e.target);
      }}
      onFocus={onFocus}
      className={cn(
        "w-full p-4",
        "text-base leading-relaxed",
        "bg-transparent",
        "resize-none outline-none",
        "scrollbar scrollbar-hide",
        "rounded-lg",
        "transition-colors duration-300 ease-in-out",
        "border-2",
        "border-gray-500/30", // 기본 회색 테두리 추가
        "hover:border-white/30",
        "focus:border-purple-400/50 focus:ring-2 focus:ring-purple-500/30",
        !content && "text-white/40"
      )}
      placeholder="내용을 입력하세요..."
      data-block-id={blockId}
      style={{
        textShadow: "0 2px 4px rgba(0,0,0,0.1)",
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(10px)",
        borderRadius: "1rem",
        overflow: "hidden",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{
        background: "rgba(255, 255, 255, 0.08)",
        boxShadow: "0 8px 32px rgba(31, 38, 135, 0.1)",
      }}
    />
  );
};

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
      Moment.parse({
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
    const newBlock = Block.parse({
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

      let actionFn;
      switch (action) {
        case "spellcheck":
          actionFn = spellCheck;
          break;
        case "summarize":
          actionFn = summarize;
          break;
        case "rewrite":
          actionFn = rewrite;
          break;
        case "translate":
          actionFn = translate;
          break;
        case "elaborate":
          actionFn = elaborate;
          break;
      }

      const response = await generate(
        actionFn(block.versions[block.selectedVersion].content, [])
      );

      if (response.status === "error") {
        throw new Error(response.error);
      }

      setBlocks((prev) =>
        prev.map((b) =>
          b.id === blockId
            ? {
                ...b,
                versions: [
                  ...b.versions,
                  {
                    content: response.text.trim(),
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

  const handleTitleAiRefine = async () => {
    if (!title.trim()) return;

    try {
      setIsTitleAiRefining(true);
      const response = await generate(titleRefinement(title, []));

      if (response.status === "success") {
        setTitle(response.text.trim());
        setIsFormDirty(true);
      } else {
        setError(response.error);
      }
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
      className="min-h-screen md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
        backdropFilter: "blur(20px)",
      }}
    >
      <motion.div
        className="max-w-4xl mx-auto space-y-8"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <NavigationBar
          onBack={() => router.back()}
          onSubmit={handleSubmit}
          isFormDirty={isFormDirty}
          isLoading={isLoading}
        />

        <motion.form
          className="space-y-8"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
        >
          <motion.div
            className="relative p-8 rounded-3xl overflow-hidden"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(40px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 8px 32px rgba(31, 38, 135, 0.15)",
            }}
            whileHover={{
              boxShadow: "0 8px 32px rgba(31, 38, 135, 0.25)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="absolute inset-0 -z-10"
              initial={false}
              animate={{
                background: [
                  "linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
                  "linear-gradient(45deg, rgba(255,255,255,0.05), rgba(255,255,255,0.1))",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />

            <motion.div className="space-y-8">
              <TitleInput
                title={title}
                onChange={handleTitleChange}
                validationErrors={validationErrors}
                onAiRefine={handleTitleAiRefine}
                isGenerating={isTitleAiRefining}
              />

              <SpaceManager
                availableSpaces={availableSpaces}
                selectedSpaces={selectedSpaces}
                setSelectedSpaces={setSelectedSpaces}
                setIsFormDirty={setIsFormDirty}
                metadata={metadata}
                validationErrors={validationErrors}
              />

              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Label className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                  내용
                </Label>
                <div className="space-y-4">
                  {blocks.map((block) => (
                    <motion.div
                      key={block.id}
                      className={cn(
                        "group relative rounded-xl w-full",
                        "transition-all duration-300",
                        "border border-white/10",
                        block.versions.length > 1 && "bg-purple-50/5",
                        focusedBlockId === block.id && "bg-white/5"
                      )}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        borderColor: "rgba(255, 255, 255, 0.2)",
                      }}
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
                          <BlockContent
                            content={
                              block.versions[block.selectedVersion].content
                            }
                            onChange={(content) =>
                              handleBlockChange(block.id, content)
                            }
                            onFocus={() => setFocusedBlockId(block.id)}
                            blockId={block.id}
                          />
                          <AnimatePresence>
                            {block.isProcessing && (
                              <AiProcessing
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
                        isFirst={block.id === blocks[0].id}
                        isLast={block.id === blocks[blocks.length - 1].id}
                        isFocused={focusedBlockId === block.id}
                      />
                    </motion.div>
                  ))}
                </div>
                {validationErrors?.errors
                  .filter((e) => e.path[0] === "blocks")
                  .map((error, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-500 flex items-center gap-1"
                    >
                      <MdWarning className="w-4 h-4" />
                      {error.message}
                    </motion.p>
                  ))}
              </motion.div>
              <MetadataBadges authorInfo={authorInfo} metadata={metadata} />
            </motion.div>
          </motion.div>
        </motion.form>
      </motion.div>
    </motion.div>
  );
}

function SpaceManager({
  availableSpaces,
  selectedSpaces,
  setSelectedSpaces,
  setIsFormDirty,
  metadata,
  validationErrors,
}: {
  availableSpaces: Space[];
  selectedSpaces: Space[];
  setSelectedSpaces: (spaces: Space[]) => void;
  setIsFormDirty: (isDirty: boolean) => void;
  metadata: Metadata;
  validationErrors: z.ZodError | null;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSpaceSelect = (space: Space) => {
    const newSelectedSpaces = selectedSpaces.some((s) => s.id === space.id)
      ? selectedSpaces.filter((s) => s.id !== space.id)
      : [...selectedSpaces, space];

    setSelectedSpaces(newSelectedSpaces);

    const originalSpaceIds = availableSpaces
      .filter((space) => space.moments.includes(metadata.id))
      .map((space) => space.id);

    const currentSpaceIds = newSelectedSpaces.map((s) => s.id);
    const isDirty =
      !originalSpaceIds.every((id) => currentSpaceIds.includes(id)) ||
      !currentSpaceIds.every((id) => originalSpaceIds.includes(id));

    setIsFormDirty(isDirty);
  };

  const filteredSpaces = availableSpaces.filter((space) =>
    space.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Label className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
        Space 관리
      </Label>

      {selectedSpaces.length > 0 && (
        <motion.div
          className="flex items-center gap-2 p-2 rounded-lg bg-white/5 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.span className="text-xs text-black/60 text-nowrap">
            선택됨:
          </motion.span>
          <motion.div className="flex flex-wrap gap-1">
            {selectedSpaces.map((space) => (
              <Badge
                key={space.id}
                variant="secondary"
                className="text-xs bg-purple-500/20"
              >
                {space.title}
              </Badge>
            ))}
          </motion.div>
        </motion.div>
      )}

      <Input
        type="search"
        placeholder="Space 검색..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2"
      />

      <motion.div
        className="h-48 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-white/5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div className="py-1">
          {filteredSpaces.map((space) => (
            <motion.div
              key={space.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
              }}
              onClick={() => handleSpaceSelect(space)}
              className={cn(
                "relative cursor-pointer p-3 mb-2",
                "rounded-xl",
                "backdrop-blur-md",
                selectedSpaces.some((s) => s.id === space.id)
                  ? "bg-purple-100/90 shadow-lg shadow-purple-500/10"
                  : "bg-white/80 hover:bg-white/90",
                "border border-purple-200",
                "transition-all duration-200 ease-in-out"
              )}
            >
              <motion.div className="flex justify-between items-center">
                <motion.div className="flex items-center gap-3">
                  <motion.div
                    className={
                      selectedSpaces.some((s) => s.id === space.id)
                        ? "text-purple-600"
                        : "text-purple-400"
                    }
                  >
                    <Check className="w-4 h-4" />
                  </motion.div>
                  <motion.span className="text-sm font-medium text-gray-800">
                    {space.title}
                  </motion.span>
                </motion.div>
                <motion.span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-600">
                  {space.moments.length}개
                </motion.span>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {validationErrors?.errors
        .filter((e) => e.path[0] === "spaces")
        .map((error, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500 flex items-center gap-1"
          >
            <MdWarning className="w-4 h-4" />
            {error.message}
          </motion.p>
        ))}
    </motion.div>
  );
}
