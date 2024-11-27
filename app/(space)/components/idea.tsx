"use client";

import { motion } from "framer-motion";
import { Heart, MoreHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { getUser } from "@/actions/user";
import { authorizeUser } from "@/actions/auth";
import { deleteMoment } from "@/actions/moment/primitives";
import type { User } from "@/db/user";
import { HttpStatus } from "@/actions/response";
import { formatDate } from "@/lib/utils";

interface IdeaMomentProps {
  moments: Moment[];
}

export function IdeaMoments({ moments }: IdeaMomentProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {moments.map((moment, index) => (
        <IdeaMoment key={moment.id} moment={moment} index={index} />
      ))}
    </div>
  );
}

interface SingleIdeaMomentProps {
  moment: Moment;
  index: number;
}

function IdeaMoment({ moment, index }: SingleIdeaMomentProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [author, setAuthor] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    const fetchAuthor = async () => {
      const response = await getUser(moment.author);
      if (response.status === 200) {
        setAuthor(response.data);
      }
    };

    const fetchCurrentUser = async () => {
      const response = await authorizeUser();
      if (response.status === 200) {
        setCurrentUser(response.data);
      }
    };

    fetchAuthor();
    fetchCurrentUser();
  }, [moment.author]);

  const handleEdit = () => {
    router.push(`/moment/${moment.id}/edit`);
  };

  const handleDelete = async () => {
    const response = await deleteMoment({ id: moment.id });
    if (response.status === HttpStatus.OK) {
      router.refresh();
    } else {
      alert("삭제에 실패했습니다.");
    }
  };

  const isAuthor = currentUser?.id === moment.author;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div 
          className="bg-gradient-to-br from-violet-100 to-pink-100 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-300 border border-white/30 shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 * index }}
          whileHover={{ y: -5 }}
        >
          <div className="flex flex-col h-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{moment.title}</h2>
            
            <div className="mt-auto flex items-center justify-between">
              <div className="flex items-center">
                {author && (
                  <Image
                    src={author.image || "/default-profile.png"}
                    alt={author.name}
                    width={24}
                    height={24}
                    className="rounded-full mr-2"
                  />
                )}
                <p className="text-sm text-gray-600">
                  {author?.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${isLiked ? 'text-pink-500' : 'text-gray-600'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLiked(!isLiked);
                  }}
                >
                  <Heart className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} />
                </Button>
                {isAuthor && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleEdit();
                      }}>수정하기</DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteAlert(true);
                        }} 
                        className="text-red-600"
                      >
                        삭제하기
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] bg-white/95 backdrop-blur-lg md:max-h-[90vh] h-[100dvh] md:h-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{moment.title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 overflow-y-auto max-h-[calc(90vh-10rem)] md:max-h-[calc(90vh-8rem)]">
          <div className="flex items-center text-sm text-gray-500 mb-4">
            {author && (
              <Image
                src={author.image || "/default-profile.png"}
                alt={author.name}
                width={32}
                height={32}
                className="rounded-full mr-2"
              />
            )}
            <span>
              {author?.name} • {formatDate(moment.createdAt)}
            </span>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{moment.content}</p>
        </div>
      </DialogContent>

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
    </Dialog>
  );
}
