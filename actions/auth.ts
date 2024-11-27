"use server";

import { auth, signIn as login, signOut as logout, update } from "@/auth";
import { User } from "@/db/user";
import { ApiResponseWithData, HttpStatus } from "./response";

export { auth, login, logout, update };

export async function authorizeUser(): Promise<ApiResponseWithData<User>> {
  const session = await auth();
  const user = User.safeParse(session?.user);

  if (user.error) {
    return {
      status: HttpStatus.UNAUTHORIZED,
      errorMessages: ["인증되지 않은 요청입니다."],
    };
  }

  return {
    status: HttpStatus.OK,
    message: "사용자 정보를 조회했습니다.",
    data: user.data,
  };
}
