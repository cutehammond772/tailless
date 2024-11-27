"use server";

import { authorizeUser } from "../auth";
import { HttpStatus, ApiResponse } from "../response";
import { getSpace, updateSpace } from "./primitives";

/**
 * Space에 새로운 태그들을 추가합니다. Contributor만 수정할 수 있습니다.
 */
export async function addTags(data: {
  spaceId: string;
  tags: string[];
}): Promise<ApiResponse> {
  // 1. 사용자 인증 확인
  const authorization = await authorizeUser();

  if (authorization.status !== HttpStatus.OK) {
    return authorization;
  }

  // 2. Space 조회
  const spaceResponse = await getSpace({ id: data.spaceId });

  if (spaceResponse.status !== HttpStatus.OK) {
    return spaceResponse;
  }

  const spaceData = spaceResponse.data;

  // 3. 권한 확인 (contributor인지)
  if (!spaceData.contributors.includes(authorization.data.id)) {
    return {
      status: HttpStatus.FORBIDDEN,
      errorMessages: ["태그를 수정할 권한이 없습니다."],
    };
  }

  // 4. 태그 추가 (중복 제거)
  const newTags = Array.from(new Set([...spaceData.tags, ...data.tags]));
  await updateSpace({
    id: data.spaceId,
    tags: newTags,
  });

  return {
    status: HttpStatus.OK,
    message: "태그가 성공적으로 추가되었습니다.",
  };
}

/**
 * Space에서 특정 태그들을 삭제합니다. Contributor만 수정할 수 있습니다.
 */
export async function deleteTags(data: {
  spaceId: string;
  tags: string[];
}): Promise<ApiResponse> {
  // 1. 사용자 인증 확인
  const authorization = await authorizeUser();

  if (authorization.status !== HttpStatus.OK) {
    return authorization;
  }

  // 2. Space 조회
  const spaceResponse = await getSpace({ id: data.spaceId });

  if (spaceResponse.status !== HttpStatus.OK) {
    return spaceResponse;
  }

  const spaceData = spaceResponse.data;

  // 3. 권한 확인 (contributor인지)
  if (!spaceData.contributors.includes(authorization.data.id)) {
    return {
      status: HttpStatus.FORBIDDEN,
      errorMessages: ["태그를 수정할 권한이 없습니다."],
    };
  }

  // 4. 태그 삭제
  const newTags = spaceData.tags.filter((tag: string) => !data.tags.includes(tag));
  await updateSpace({
    id: data.spaceId,
    tags: newTags,
  });

  return {
    status: HttpStatus.OK,
    message: "태그가 성공적으로 삭제되었습니다.",
  };
}

/**
 * Space의 모든 태그를 삭제합니다. Contributor만 수정할 수 있습니다.
 */
export async function deleteAllTags(data: {
  spaceId: string;
}): Promise<ApiResponse> {
  // 1. 사용자 인증 확인
  const authorization = await authorizeUser();

  if (authorization.status !== HttpStatus.OK) {
    return authorization;
  }

  // 2. Space 조회
  const spaceResponse = await getSpace({ id: data.spaceId });

  if (spaceResponse.status !== HttpStatus.OK) {
    return spaceResponse;
  }

  const spaceData = spaceResponse.data;

  // 3. 권한 확인 (contributor인지)
  if (!spaceData.contributors.includes(authorization.data.id)) {
    return {
      status: HttpStatus.FORBIDDEN,
      errorMessages: ["태그를 수정할 권한이 없습니다."],
    };
  }

  // 4. 모든 태그 삭제
  await updateSpace({
    id: data.spaceId,
    tags: [],
  });

  return {
    status: HttpStatus.OK,
    message: "모든 태그가 성공적으로 삭제되었습니다.",
  };
}
