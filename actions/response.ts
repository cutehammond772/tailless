// HTTP 상태 코드 정의
export const HttpStatus = {
  // 성공
  OK: 200,

  // 클라이언트 에러
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,

  // 서버 에러
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type ApiResponseWithData<T> = {
  status: typeof HttpStatus.OK;
  message: string;
  data: T;
} | ErrorResponse;

export type ApiResponse = {
  status: typeof HttpStatus.OK;
  message: string;
} | ErrorResponse;

export type ErrorResponse = {
  status: (typeof HttpStatus)[keyof Omit<typeof HttpStatus, "OK">];
  errorMessages: string[];
};
