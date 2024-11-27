"use server";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  CreateSpace,
  UpdateSpace,
  DeleteSpace,
  Space,
  GetSpace,
  GetSpaces,
} from "@/db/space";
import { authorizeUser } from "../auth";
import { HttpStatus, ApiResponse, ApiResponseWithData } from "../response";

/**
 * Space를 생성합니다.
 */
export async function createSpace(
  data: CreateSpace
): Promise<ApiResponseWithData<Space>> {
  // 1. 사용자 인증 확인
  const authorization = await authorizeUser();

  if (authorization.status !== HttpStatus.OK) {
    return authorization;
  }

  // 2. 입력 데이터 검증
  const result = CreateSpace.safeParse(data);

  if (result.error) {
    return {
      status: HttpStatus.BAD_REQUEST,
      errorMessages: ["잘못된 입력값입니다."],
    };
  }

  if (!result.data.contributors.includes(authorization.data.id)) {
    return { status: HttpStatus.FORBIDDEN, errorMessages: ["권한이 없습니다."] };
  }

  // 3. 서버 데이터 검증
  const collectionRef = collection(db, "spaces");

  const checkQuery = query(
    collectionRef,
    where("title", "==", result.data.title)
  );
  const snapshot = await getDocs(checkQuery);

  if (!snapshot.empty) {
    return {
      status: HttpStatus.CONFLICT,
      errorMessages: ["이미 존재하는 Space입니다."],
    };
  }

  // 4. Space 생성
  const docRef = await addDoc(collectionRef, result.data);

  return {
    status: HttpStatus.OK,
    message: "Space가 성공적으로 생성되었습니다.",
    data: Space.parse({ ...result.data, id: docRef.id }),
  };
}

export async function getSpace(
  data: GetSpace
): Promise<ApiResponseWithData<Space>> {
  // 1. 입력 데이터 검증
  const result = GetSpace.safeParse(data);

  if (result.error) {
    return {
      status: HttpStatus.BAD_REQUEST,
      errorMessages: ["잘못된 입력값입니다."],
    };
  }

  // 2. Space 조회
  const collectionRef = collection(db, "spaces");
  const docRef = doc(collectionRef, result.data.id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return {
      status: HttpStatus.NOT_FOUND,
      errorMessages: ["Space를 찾을 수 없습니다."],
    };
  }

  return {
    status: HttpStatus.OK,
    message: "Space를 성공적으로 조회했습니다.",
    data: Space.parse({ ...snapshot.data(), id: snapshot.id }),
  };
}

export async function updateSpace(data: UpdateSpace): Promise<ApiResponse> {
  // 1. 사용자 인증 확인
  const authorization = await authorizeUser();

  if (authorization.status !== HttpStatus.OK) {
    return authorization;
  }

  // 2. 입력 데이터 검증
  const result = UpdateSpace.safeParse(data);

  if (result.error) {
    return {
      status: HttpStatus.BAD_REQUEST,
      errorMessages: ["잘못된 입력값입니다."],
    };
  }

  // 3. Space 업데이트
  const collectionRef = collection(db, "spaces");
  const docRef = doc(collectionRef, result.data.id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return {
      status: HttpStatus.NOT_FOUND,
      errorMessages: ["Space를 찾을 수 없습니다."],
    };
  }

  // 4. 권한 확인
  const spaceData = snapshot.data();
  if (!spaceData.contributors.includes(authorization.data.id)) {
    return {
      status: HttpStatus.FORBIDDEN,
      errorMessages: ["권한이 없습니다."],
    };
  }

  await updateDoc(docRef, result.data);

  return {
    status: HttpStatus.OK,
    message: "Space가 성공적으로 업데이트되었습니다.",
  };
}

export async function deleteSpace(data: DeleteSpace): Promise<ApiResponse> {
  // 1. 사용자 인증 확인
  const authorization = await authorizeUser();

  if (authorization.status !== HttpStatus.OK) {
    return authorization;
  }

  // 2. 입력 데이터 검증
  const result = DeleteSpace.safeParse(data);

  if (result.error) {
    return {
      status: HttpStatus.BAD_REQUEST,
      errorMessages: ["잘못된 입력값입니다."],
    };
  }

  // 3. Space 삭제
  const collectionRef = collection(db, "spaces");
  const docRef = doc(collectionRef, result.data.id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return {
      status: HttpStatus.NOT_FOUND,
      errorMessages: ["Space를 찾을 수 없습니다."],
    };
  }

  // 4. 권한 확인
  const spaceData = snapshot.data();
  if (!spaceData.contributors.includes(authorization.data.id)) {
    return {
      status: HttpStatus.FORBIDDEN,
      errorMessages: ["권한이 없습니다."],
    };
  }

  await deleteDoc(docRef);
  return {
    status: HttpStatus.OK,
    message: "Space가 성공적으로 삭제되었습니다.",
  };
}

/**
 * Space를 특정 조건에 따라 불러옵니다.
 */
export async function getSpaces(
  data: GetSpaces
): Promise<ApiResponseWithData<Space[]>> {
  const result = GetSpaces.safeParse(data);

  if (result.error) {
    return {
      status: HttpStatus.BAD_REQUEST,
      errorMessages: ["잘못된 입력값입니다."],
    };
  }

  const { title, tags, contributors } = result.data;
  const collectionRef = collection(db, "spaces");
  let queryRef = query(collectionRef);

  if (title) {
    queryRef = query(
      queryRef,
      where("title", ">=", title),
      where("title", "<=", title + "\uf8ff")
    );
  }

  if (tags?.length) {
    queryRef = query(queryRef, where("tags", "array-contains-any", tags));
  }

  if (contributors?.length) {
    queryRef = query(
      queryRef,
      where("contributors", "array-contains-any", contributors)
    );
  }

  const snapshot = await getDocs(queryRef);

  return {
    status: HttpStatus.OK,
    message: "Space 목록을 성공적으로 조회했습니다.",
    data: snapshot.docs.map((doc) =>
      Space.parse({
        ...doc.data(),
        id: doc.id,
      })
    ),
  };
}
