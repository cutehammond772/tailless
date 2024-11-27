"use client";

import { MoreHorizontal, Pencil, Trash2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

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
import { Button } from "@/components/ui/button";
import { Space } from "@/db/space";
import { deleteSpace } from "@/actions/space/primitives";
import { removeContributor } from "@/actions/space/contributor";
import { HttpStatus } from "@/actions/response";

interface SpaceOptionProps {
  space: Space;
}

export default function SpaceOption({ space }: SpaceOptionProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  if (!session?.user?.id) return null;

  const isContributor = space.contributors.includes(session.user.id);
  const isLastContributor = space.contributors.length === 1;

  const handleEdit = () => {
    router.push(`/space/${space.id}/edit`);
  };

  const handleDelete = async () => {
    try {
      const response = await deleteSpace({ id: space.id });
      
      if (response.status === HttpStatus.OK) {
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Space 삭제 중 오류 발생:", error);
    }
  };

  const handleLeave = async () => {
    try {
      const response = await removeContributor({ spaceId: space.id });
      
      if (response.status === HttpStatus.OK) {
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Space 나가기 중 오류 발생:", error);
    }
  };

  if (!isContributor) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="bg-black/20 hover:bg-black/30 text-white"
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleEdit} className="gap-2">
            <Pencil className="w-4 h-4" />
            수정하기
          </DropdownMenuItem>
          {!isLastContributor && (
            <DropdownMenuItem 
              onClick={handleLeave}
              className="gap-2 text-orange-600"
            >
              <LogOut className="w-4 h-4" />
              나가기
            </DropdownMenuItem>
          )}
          <DropdownMenuItem 
            onClick={() => setShowDeleteAlert(true)}
            className="gap-2 text-red-600"
          >
            <Trash2 className="w-4 h-4" />
            삭제하기
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. Space와 관련된 모든 데이터가 영구적으로 삭제됩니다.
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
    </>
  );
}
