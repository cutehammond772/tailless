"use server";

import { HttpStatus, ApiResponse } from "../response";
import { getSpace, updateSpace } from "./primitives";
import { getMoment } from "../moment/primitives";
import { authorizeUser } from "../auth";

/**
 * Space에 Moment를 추가합니다.
 */
export async function addMomentToSpace(
  spaceId: string,
  momentId: string
): Promise<ApiResponse> {
  // 1. 사용자 인증 확인
  const authorization = await authorizeUser();

  if (authorization.status !== HttpStatus.OK) {
    return authorization;
  }

  // 2. Space 확인
  const spaceSnapshot = await getSpace({ id: spaceId });

  if (spaceSnapshot.status !== HttpStatus.OK) {
    return spaceSnapshot;
  }

  const spaceData = spaceSnapshot.data;

  // 3. 권한 확인
  if (!spaceData.contributors.includes(authorization.data.id)) {
    return { 
      status: HttpStatus.FORBIDDEN, 
      errorMessages: ["권한이 없습니다."] 
    };
  }

  // 4. Moment 확인
  const momentResponse = await getMoment({ id: momentId });

  if (momentResponse.status !== HttpStatus.OK) {
    return momentResponse;
  }

  const momentData = momentResponse.data;

  // 5. Moment 작성자 확인
  if (momentData.author !== authorization.data.id) {
    return { 
      status: HttpStatus.FORBIDDEN, 
      errorMessages: ["권한이 없습니다."] 
    };
  }

  // 6. Space에 Moment 추가
  const moments = spaceData.moments || [];
  if (moments.includes(momentId)) {
    return {
      status: HttpStatus.BAD_REQUEST,
      errorMessages: ["이미 추가된 Moment입니다."],
    };
  }

  const updateSpaceResponse = await updateSpace({ id: spaceId, moments: [...moments, momentId] });

  if (updateSpaceResponse.status !== HttpStatus.OK) {
    return updateSpaceResponse;
  }

  return {
    status: HttpStatus.OK,
    message: "Moment가 성공적으로 추가되었습니다.",
  };
}

/**
 * Space에서 Moment를 제거합니다.
 */
export async function removeMomentFromSpace(
  spaceId: string,
  momentId: string
): Promise<ApiResponse> {
  // 1. 사용자 인증 확인
  const authorization = await authorizeUser();

  if (authorization.status !== HttpStatus.OK) {
    return authorization;
  }

  // 2. Space 확인
  const spaceResponse = await getSpace({ id: spaceId });
  if (spaceResponse.status !== HttpStatus.OK) {
    return spaceResponse;
  }

  const spaceData = spaceResponse.data;

  // 3. 권한 확인
  if (!spaceData.contributors.includes(authorization.data.id)) {
    return { 
      status: HttpStatus.FORBIDDEN, 
      errorMessages: ["권한이 없습니다."] 
    };
  }

  // 4. Moment 확인
  const momentResponse = await getMoment({ id: momentId });

  if (momentResponse.status !== HttpStatus.OK) {
    return momentResponse;
  }

  const momentData = momentResponse.data;

  // 5. Moment 작성자 확인
  if (momentData.author !== authorization.data.id) {
    return { 
      status: HttpStatus.FORBIDDEN, 
      errorMessages: ["권한이 없습니다."] 
    };
  }

  // 6. Space에서 Moment 제거
  const moments = spaceData.moments || [];

  if (!moments.includes(momentId)) {
    return {
      status: HttpStatus.BAD_REQUEST,
      errorMessages: ["존재하지 않는 Moment입니다."],
    };
  }

  const updateSpaceResponse = await updateSpace({ id: spaceId, moments: moments.filter((id: string) => id !== momentId) });

  if (updateSpaceResponse.status !== HttpStatus.OK) {
    return updateSpaceResponse;
  }

  return {
    status: HttpStatus.OK,
    message: "Moment가 성공적으로 제거되었습니다.",
  };
}
