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
  CreateMoment,
  UpdateMoment,
  DeleteMoment,
  Moment,
  GetMoment,
  GetMoments,
} from "@/db/moment";
import { authorizeUser } from "../auth";
import { HttpStatus, ApiResponseWithData, ApiResponse } from "../response";
import { removeMomentFromSpace } from "../space/moment";

/**
 * Moment를 생성합니다.
 */
export async function createMoment(data: CreateMoment): Promise<ApiResponseWithData<Moment>> {
  // 1. 사용자 인증 확인
  const authorization = await authorizeUser();

  if (authorization.status !== HttpStatus.OK) {
    return authorization;
  }

  // 2. 입력 데이터 검증
  const result = CreateMoment.safeParse(data);

  if (result.error) {
    return { status: HttpStatus.BAD_REQUEST, errorMessages: ["잘못된 입력값입니다."] };
  }

  if (result.data.author !== authorization.data.id) {
    return { status: HttpStatus.FORBIDDEN, errorMessages: ["권한이 없습니다."] };
  }

  // 3. Moment 생성
  const collectionRef = collection(db, "moments");
  const docRef = await addDoc(collectionRef, {
    ...result.data,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  });

  return {
    status: HttpStatus.OK,
    message: "Moment가 성공적으로 생성되었습니다.",
    data: Moment.parse({ ...result.data, id: docRef.id }),
  };
}

export async function getMoment(data: GetMoment): Promise<ApiResponseWithData<Moment>> {
  // 1. 입력 데이터 검증
  const result = GetMoment.safeParse(data);

  if (result.error) {
    return { status: HttpStatus.BAD_REQUEST, errorMessages: ["잘못된 입력값입니다."] };
  }

  // 2. Moment 조회
  const collectionRef = collection(db, "moments");
  const docRef = doc(collectionRef, result.data.id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return {
      status: HttpStatus.NOT_FOUND,
      errorMessages: ["Moment를 찾을 수 없습니다."],
    };
  }

  return {
    status: HttpStatus.OK,
    message: "Moment를 성공적으로 조회했습니다.",
    data: Moment.parse({ ...snapshot.data(), id: snapshot.id }),
  };
}

export async function updateMoment(data: UpdateMoment): Promise<ApiResponse> {
  // 1. 사용자 인증 확인
  const authorization = await authorizeUser();

  if (authorization.status !== HttpStatus.OK) {
    return authorization;
  }

  // 2. 입력 데이터 검증
  const result = UpdateMoment.safeParse(data);

  if (result.error) {
    return { status: HttpStatus.BAD_REQUEST, errorMessages: ["잘못된 입력값입니다."] };
  }

  // 3. Moment 업데이트
  const collectionRef = collection(db, "moments");
  const docRef = doc(collectionRef, result.data.id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return {
      status: HttpStatus.NOT_FOUND,
      errorMessages: ["Moment를 찾을 수 없습니다."],
    };
  }

  // 4. 권한 확인
  const momentData = snapshot.data();
  if (momentData.author !== authorization.data.id) {
    return { status: HttpStatus.FORBIDDEN, errorMessages: ["권한이 없습니다."] };
  }

  await updateDoc(docRef, {
    ...result.data,
    modifiedAt: new Date().toISOString(),
  });

  return {
    status: HttpStatus.OK,
    message: "Moment가 성공적으로 업데이트되었습니다.",
  };
}

export async function deleteMoment(data: DeleteMoment): Promise<ApiResponse> {
  // 1. 사용자 인증 확인
  const authorization = await authorizeUser();

  if (authorization.status !== HttpStatus.OK) {
    return authorization;
  }

  // 2. 입력 데이터 검증
  const result = DeleteMoment.safeParse(data);

  if (result.error) {
    return { status: HttpStatus.BAD_REQUEST, errorMessages: ["잘못된 입력값입니다."] };
  }

  // 3. Moment 삭제
  const collectionRef = collection(db, "moments");
  const docRef = doc(collectionRef, result.data.id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return {
      status: HttpStatus.NOT_FOUND,
      errorMessages: ["Moment를 찾을 수 없습니다."],
    };
  }

  // 4. 권한 확인
  const momentData = snapshot.data();
  if (momentData.author !== authorization.data.id) {
    return { status: HttpStatus.FORBIDDEN, errorMessages: ["권한이 없습니다."] };
  }

  // 5. Space에서 Moment 제거
  const spacesSnapshot = await getDocs(query(collection(db, "spaces"), where("moments", "array-contains", result.data.id)));
  for (const spaceDoc of spacesSnapshot.docs) {
    await removeMomentFromSpace(spaceDoc.id, result.data.id);
  }

  await deleteDoc(docRef);

  return {
    status: HttpStatus.OK,
    message: "Moment가 성공적으로 삭제되었습니다.",
  };
}

/**
 * Moment를 특정 조건에 따라 불러옵니다.
 */
export async function getMoments(data: GetMoments): Promise<ApiResponseWithData<Moment[]>> {
  const result = GetMoments.safeParse(data);

  if (result.error) {
    return { status: HttpStatus.BAD_REQUEST, errorMessages: ["잘못된 입력값입니다."] };
  }

  const { title, author } = result.data;
  const collectionRef = collection(db, "moments");
  let queryRef = query(collectionRef);

  if (title) {
    queryRef = query(
      queryRef,
      where("title", ">=", title),
      where("title", "<=", title + "\uf8ff")
    );
  }

  if (author) {
    queryRef = query(queryRef, where("author", "==", author));
  }

  const snapshot = await getDocs(queryRef);

  return {
    status: HttpStatus.OK,
    message: "Moment 목록을 성공적으로 조회했습니다.",
    data: snapshot.docs.map((doc) =>
      Moment.parse({
        ...doc.data(),
        id: doc.id,
      })
    ),
  };
}
