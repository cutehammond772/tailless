"use client";

import * as motion from "framer-motion/client";
import { MoreHorizontal, Heart, Share2 } from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { getUser } from "@/actions/user";
import { deleteMoment } from "@/actions/moment/primitives";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { Moment } from "@/db/moment";
import type { User } from "@/db/user";
import { HttpStatus } from "@/actions/response";
import { formatDate } from "@/lib/utils";

interface MomentCardProps {
  moment: Moment;
  children: React.ReactNode;
}

export default function MomentCard({ moment, children }: MomentCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLikedByUser, setIsLikedByUser] = useState(false);
  const [author, setAuthor] = useState<User | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const authorResponse = await getUser(moment.author);
      if (authorResponse.status === 200) {
        setAuthor(authorResponse.data);
      }
    };

    fetchData();
  }, [moment.author]);

  const handleEdit = () => router.push(`/moment/${moment.id}/edit`);
  const handleAuthorClick = () => router.push(`/user/${author?.id}`);

  const handleDelete = async () => {
    const response = await deleteMoment({ id: moment.id });
    if (response.status === HttpStatus.OK) {
      router.refresh();
    } else {
      alert("삭제에 실패했습니다.");
    }
  };

  const isAuthor = session?.user?.id === moment.author;
  const formattedTime = formatDate(moment.createdAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white/50 backdrop-blur-md rounded-xl p-6 shadow-lg"
    >
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          className="flex items-center gap-3 p-0 h-auto hover:bg-transparent"
          onClick={handleAuthorClick}
        >
          {author && (
            <Image
              src={author.image || "/default-profile.png"}
              alt={author.name}
              width={40}
              height={40}
              className="rounded-full"
            />
          )}
          <div className="text-left">
            <h3 className="font-semibold">{author?.name || "알 수 없음"}</h3>
            <p className="text-sm text-gray-500">{formattedTime}</p>
          </div>
        </Button>

        {isAuthor && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>수정하기</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteAlert(true)} className="text-red-600">삭제하기</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                이 작업은 되돌릴 수 없습니다. 모먼트가 영구적으로 삭제됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                삭제
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="space-y-4">
        {children}
      </div>

      {/* 액션 영역 */}
      <div className="mt-6 pt-4 border-t flex items-center gap-6">
        <Button
          variant="ghost"
          size="sm"
          className={`gap-2 ${isLikedByUser ? 'text-red-500' : ''}`}
          onClick={() => setIsLikedByUser(!isLikedByUser)}
        >
          <Heart className="w-5 h-5" fill={isLikedByUser ? "currentColor" : "none"} />
          <span>좋아요</span>
        </Button>

        <Button variant="ghost" size="sm" className="gap-2">
          <Share2 className="w-5 h-5" />
          <span>공유</span>
        </Button>
      </div>
    </motion.div>
  );
}