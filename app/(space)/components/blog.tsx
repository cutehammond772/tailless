"use client";

import * as motion from "framer-motion/client";
import { MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getUser } from "@/actions/user";
import { authorizeUser } from "@/actions/auth";
import { deleteMoment } from "@/actions/moment/primitives";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { Moment } from "@/db/moment";
import type { User } from "@/db/user";
import { HttpStatus } from "@/actions/response";
import { formatDate } from "@/lib/utils";

interface BlogMomentsProps {
  moments: Moment[];
}

export function BlogMoments({ moments }: BlogMomentsProps) {
  return (
    <div className="space-y-4">
      {moments.map((moment) => (
        <BlogMoment key={moment.id} moment={moment} />
      ))}
    </div>
  );
}

interface BlogMomentProps {
  moment: Moment;
}

function BlogMoment({ moment }: BlogMomentProps) {
  const router = useRouter();
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

  const handleClick = () => {
    router.push(`/moment/${moment.id}`);
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
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h3
            className="text-lg font-medium hover:text-blue-600 cursor-pointer"
            onClick={handleClick}
          >
            {moment.title}
          </h3>
          <div className="flex items-center gap-3 mt-2">
            {author && (
              <div className="flex items-center gap-2">
                <Image
                  src={author.image || "/default-profile.png"}
                  alt={author.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <span className="text-sm text-gray-700">{author.name}</span>
              </div>
            )}
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-500">
              {formatDate(moment.createdAt)}
            </span>
          </div>
        </div>

        {isAuthor && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>수정하기</DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteAlert(true)} 
                className="text-red-600"
              >
                삭제하기
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

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
    </motion.article>
  );
}
