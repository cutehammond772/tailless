"use server";

import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "@/db/user";
import { authorizeUser } from "./auth";
import { ApiResponseWithData, HttpStatus } from "./response";

/**
 * 사용자 정보를 조회합니다.
 */
export async function getUser(id: string): Promise<ApiResponseWithData<User>> {
  // 1. 입력 데이터 검증
  if (!id) {
    return {
      status: HttpStatus.BAD_REQUEST,
      errorMessages: ["사용자 ID가 필요합니다."],
    };
  }

  // 2. 사용자 조회
  const collectionRef = collection(db, "users");
  const docRef = doc(collectionRef, id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return {
      status: HttpStatus.NOT_FOUND,
      errorMessages: ["사용자를 찾을 수 없습니다."],
    };
  }

  return {
    status: HttpStatus.OK,
    message: "사용자 정보를 성공적으로 조회했습니다.",
    data: User.parse({ ...snapshot.data(), id: snapshot.id }),
  };
}

/**
 * 사용자 목록을 조회합니다.
 */
export async function getUsers(params: {
  name?: string;
  email?: string;
}): Promise<ApiResponseWithData<User[]>> {
  // 1. 사용자 인증 확인
  const authorization = await authorizeUser();

  if (authorization.status !== HttpStatus.OK) {
    return authorization;
  }

  // 2. 사용자 목록 조회
  const { name, email } = params;
  const collectionRef = collection(db, "users");
  let queryRef = query(collectionRef);

  if (name) {
    queryRef = query(
      queryRef,
      where("name", ">=", name),
      where("name", "<=", name + "\uf8ff")
    );
  }

  if (email) {
    queryRef = query(queryRef, where("email", "==", email));
  }

  const snapshot = await getDocs(queryRef);

  return {
    status: HttpStatus.OK,
    message: "사용자 목록을 성공적으로 조회했습니다.",
    data: snapshot.docs.map((doc) =>
      User.parse({
        ...doc.data(),
        id: doc.id,
      })
    ),
  };
}
