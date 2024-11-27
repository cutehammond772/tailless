"use server";

import { authorizeUser } from "../auth";
import { HttpStatus, ApiResponse } from "../response";
import { getSpace, updateSpace } from "./primitives";
import { getUser } from "../user";

/**
 * Space의 contributor를 추가합니다.
 * 해당 Space의 contributor만이 다른 contributor를 추가할 수 있습니다.
 */
export async function addContributor(data: {
  spaceId: string;
  userId: string;
}): Promise<ApiResponse> {
  // 1. 사용자 인증 확인
  const authorization = await authorizeUser();

  if (authorization.status !== HttpStatus.OK) {
    return authorization;
  }

  // 2. Space 조회
  const spaceData = await getSpace({ id: data.spaceId });

  if (spaceData.status !== HttpStatus.OK) {
    return spaceData;
  }

  // 3. 요청자가 contributor인지 확인
  if (!spaceData.data.contributors.includes(authorization.data.id)) {
    return {
      status: HttpStatus.FORBIDDEN,
      errorMessages: ["Contributor만 다른 사용자를 추가할 수 있습니다."],
    };
  }

  // 4. 추가하려는 사용자가 존재하는지 확인
  const userResponse = await getUser(data.userId);
  if (userResponse.status !== HttpStatus.OK) {
    return {
      status: HttpStatus.NOT_FOUND,
      errorMessages: ["존재하지 않는 사용자입니다."],
    };
  }

  // 5. 추가하려는 사용자가 이미 contributor인지 확인
  if (spaceData.data.contributors.includes(data.userId)) {
    return {
      status: HttpStatus.CONFLICT,
      errorMessages: ["해당 사용자는 이미 Contributor로 등록되어 있습니다."],
    };
  }

  // 6. contributor 추가
  const updateSpaceResponse = await updateSpace({
    id: data.spaceId,
    contributors: [...spaceData.data.contributors, data.userId],
  });

  if (updateSpaceResponse.status !== HttpStatus.OK) {
    return updateSpaceResponse;
  }

  return {
    status: HttpStatus.OK,
    message: "새로운 Contributor가 성공적으로 추가되었습니다.",
  };
}

/**
 * Space의 contributor에서 자신을 제거합니다.
 */
export async function removeContributor(data: {
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

  // 3. contributor 존재 확인
  const spaceData = spaceResponse.data;
  if (!spaceData.contributors.includes(authorization.data.id)) {
    return {
      status: HttpStatus.NOT_FOUND,
      errorMessages: ["Contributor가 아닙니다."],
    };
  }

  // 4. 마지막 contributor인지 확인
  if (spaceData.contributors.length === 1) {
    return {
      status: HttpStatus.FORBIDDEN,
      errorMessages: ["마지막 Contributor는 제거할 수 없습니다."],
    };
  }

  // 5. Contributor 제거
  const updateSpaceResponse = await updateSpace({
    id: data.spaceId,
    contributors: spaceData.contributors.filter((id: string) => id !== authorization.data.id),
  });

  if (updateSpaceResponse.status !== HttpStatus.OK) {
    return updateSpaceResponse;
  }

  return {
    status: HttpStatus.OK,
    message: "Contributor에서 성공적으로 제거되었습니다.",
  };
}
