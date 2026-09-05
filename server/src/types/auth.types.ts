export type AuthContext = "BUSINESS" | "PLATFORM";

export type BusinessRole = "OWNER" | "ADMIN" | "SELLER" | "DELIVERY";

export type PlatformRole = "SUPER_ADMIN" | "SUPPORT" | "ANALYST";

export interface BusinessAccessTokenPayload {
  context: "BUSINESS";
  idUser: number;
  idBusiness: number;
  businessRole: BusinessRole;
}

export interface PlatformAccessTokenPayload {
  context: "PLATFORM";
  idUser: number;
  platformRole: PlatformRole;
}

export type AccessTokenPayload =
  | BusinessAccessTokenPayload
  | PlatformAccessTokenPayload;

export interface BusinessRefreshTokenPayload {
  context: "BUSINESS";
  idUser: number;
  idBusiness: number;
  idLogin: number;
}

export interface PlatformRefreshTokenPayload {
  context: "PLATFORM";
  idUser: number;
  idLogin: number;
}

export type RefreshTokenPayload =
  | BusinessRefreshTokenPayload
  | PlatformRefreshTokenPayload;

export interface BusinessRequestUser {
  idUser: number;
  idBusiness: number;
  role: BusinessRole;
}

export type AccessTokenInput = AccessTokenPayload;

export type RefreshTokenInput = RefreshTokenPayload;
