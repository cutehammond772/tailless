"use client";

import { motion } from "framer-motion";
import { Heart, MoreHorizontal, Plus } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Moment } from "@/db/moment";
import { getUser } from "@/actions/user";
import { authorizeUser } from "@/actions/auth";
import { deleteMoment } from "@/actions/moment/primitives";
import type { User } from "@/db/user";
import { HttpStatus } from "@/actions/response";
import { formatDate } from "@/lib/utils";

interface IdeaMomentsProps {
  moments: Moment[];
}

interface IdeaMomentProps {
  moment: Moment;
}

function AddIdeaButton() {
  const router = useRouter();

  return (
    <motion.div
      className="relative aspect-square"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="cursor-pointer transform-gpu h-full"
        whileHover={{ scale: 1.02, rotate: 1 }}
        transition={{ duration: 0.2 }}
        onClick={() => router.push('/moment/new')}
      >
        <div className="bg-green-100 rounded-none p-6 shadow-md 
                      relative h-full flex flex-col items-center justify-center
                      border-t-8 border-green-200
                      transform rotate-1
                      hover:shadow-lg transition-shadow">
          <Plus className="w-12 h-12 text-green-600 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 text-center break-keep">
            새로운 아이디어 추가하기
          </h2>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function IdeaMoments({ moments }: IdeaMomentsProps) {
  return (
    <motion.div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
      <AddIdeaButton />
      {moments.map((moment) => (
        <IdeaMoment key={moment.id} moment={moment} />
      ))}
    </motion.div>
  );
}

function IdeaMoment({ moment }: IdeaMomentProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [author, setAuthor] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [authorResponse, userResponse] = await Promise.all([
        getUser(moment.author),
        authorizeUser()
      ]);

      if (authorResponse.status === HttpStatus.OK) {
        setAuthor(authorResponse.data);
      }
      
      if (userResponse.status === HttpStatus.OK) {
        setCurrentUser(userResponse.data);
      }
    };

    fetchData();
  }, [moment.author]);

  const handleEdit = () => router.push(`/moment/${moment.id}/edit`);

  const handleDelete = async () => {
    const response = await deleteMoment({ id: moment.id });
    if (response.status === HttpStatus.OK) {
      router.refresh();
    } else {
      alert("삭제에 실패했습니다.");
    }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const isAuthor = currentUser?.id === moment.author;

  const AuthorInfo = () => (
    <div className="flex items-center h-9">
      {author && (
        <Image
          src={author.image || "/default-profile.png"}
          alt={author.name}
          width={24}
          height={24}
          className="rounded-full mr-2 border-2 border-pink-200"
        />
      )}
      <p className="text-sm text-gray-700 font-medium truncate">{author?.name}</p>
    </div>
  );

  const ActionButtons = () => (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className={`${isLiked ? "text-pink-500" : "text-gray-700"} hover:bg-transparent h-9`}
        onClick={handleLikeClick}
      >
        <Heart
          className="w-5 h-5"
          fill={isLiked ? "currentColor" : "none"}
        />
      </Button>
      {isAuthor && (
        <DropdownMenu>
          <DropdownMenuTrigger
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="ghost" size="icon" className="hover:bg-transparent h-9">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
            >
              수정하기
            </DropdownMenuItem>
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
  );

  const MomentContent = () => (
    <div className="mt-4 overflow-y-auto max-h-[calc(90vh-10rem)] md:max-h-[calc(90vh-8rem)]">
      <div className="flex items-center text-sm text-gray-600 mb-4">
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
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div
          className="relative aspect-square"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="cursor-pointer transform-gpu h-full"
            whileHover={{ scale: 1.02, rotate: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-yellow-100 rounded-none p-6 shadow-md 
                          relative h-full flex flex-col
                          border-t-8 border-yellow-200
                          transform rotate-1
                          hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                {moment.title}
              </h2>
              
              <p className="text-md text-gray-600 mb-4 line-clamp-4">
                {moment.content}
              </p>

              <div className="mt-auto flex items-center justify-end gap-4">
                <AuthorInfo />
                <ActionButtons />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] bg-yellow-50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {moment.title}
          </DialogTitle>
        </DialogHeader>
        <MomentContent />
      </DialogContent>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. Moment가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
