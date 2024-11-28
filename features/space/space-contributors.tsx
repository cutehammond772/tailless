"use client";

import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Users, Plus, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Space } from "@/db/space";
import { User } from "@/db/user";
import { HttpStatus } from "@/actions/response";
import { addContributor } from "@/actions/space/contributor";
import { useState, useEffect, useTransition } from "react";
import { getUsers } from "@/actions/user";

async function searchUsers(email: string): Promise<User[]> {
  const response = await getUsers({ email });
  if (response.status !== HttpStatus.OK) return [];
  return response.data;
}

export default function SpaceContributors({
  space,
  contributors,
}: {
  space: Space;
  contributors: User[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!email || !email.includes('@')) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    startTransition(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsers(email);
        // 기존 기여자 제외
        const filteredResults = results.filter(
          user => !space.contributors.includes(user.id)
        );
        setSearchResults(filteredResults);
      } catch (error) {
        console.error("사용자 검색 중 오류 발생:", error);
        toast({
          title: "검색 오류",
          description: "사용자 검색 중 문제가 발생했습니다.",
          variant: "destructive",
        });
      } finally {
        setIsSearching(false);
      }
    });
  }, [email, space.contributors, toast]);

  const handleAddContributor = async (userId: string) => {
    if (!session) {
      toast({
        title: "로그인이 필요합니다",
        description: "기여자를 추가하려면 먼저 로그인해주세요.",
        variant: "destructive",
      });
      return;
    }

    const response = await addContributor({
      spaceId: space.id,
      userId: userId,
    });

    if (response.status === HttpStatus.OK) {
      toast({
        title: "성공",
        description: response.message,
      });
      setShowSearchDialog(false);
      setEmail("");
      router.refresh();
    } else {
      toast({
        title: "오류 발생",
        description:
          response.errorMessages?.join("\n") ||
          "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="flex flex-1 items-center gap-2 sm:gap-3 bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50"
          >
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-medium">
              {space.contributors.length}명의 기여자
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>기여자 목록</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4 max-h-[300px] overflow-y-auto">
            {contributors.map((contributor) => (
              <Link
                key={contributor.id}
                href={`/user/${contributor.id}`}
                className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Image
                  src={contributor.image || "/default-profile.png"}
                  alt={contributor.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <p className="font-medium">{contributor.name}</p>
                  <p className="text-sm text-gray-500">{contributor.email}</p>
                </div>
              </Link>
            ))}
          </div>

          {session && space.contributors.includes(session.user.id) && (
            <Button
              onClick={() => setShowSearchDialog(true)}
              className="w-full mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              새 기여자 추가
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>새 기여자 추가</DialogTitle>
            <DialogDescription>
              이메일로 사용자를 검색하세요
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              placeholder="이메일을 입력하세요"
              className="w-full pl-10 pr-4 py-2 border rounded-md"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mt-4 max-h-[300px] overflow-y-auto">
            {isSearching || isPending ? (
              <p className="text-center text-gray-500">검색 중...</p>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={user.image || "/default-profile.png"}
                      alt={user.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddContributor(user.id)}
                  >
                    추가
                  </Button>
                </div>
              ))
            ) : email ? (
              <p className="text-center text-gray-500">검색 결과가 없습니다</p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}