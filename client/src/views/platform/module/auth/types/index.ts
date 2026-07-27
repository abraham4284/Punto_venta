export type PlatformRole = "SUPER_ADMIN" | "SUPPORT" | "ANALYST";

export type PlatformContext = "PLATFORM";

export interface PlatformUser {
  idUser: number;
  idPlatformUser: number;
  name: string;
  username: string;
  email: string | null;
  platformRole: PlatformRole;
  context: PlatformContext;
}

export interface PlatformLoginBody {
  username: string;
  password: string;
}

export interface PlatformAuthSession {
  accessToken: string;
  user: Omit<PlatformUser, "context">;
}

export interface PlatformApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PlatformFieldError {
  field: string;
  message: string;
}

export interface PlatformValidationResponse {
  success: false;
  message: string;
  errors?: PlatformFieldError[];
  data?: null;
}
