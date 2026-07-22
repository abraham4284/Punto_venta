export type User = {
  idUser: number;
  idBusiness: number;
  role: string;
  name?: string;
  username?: string;
  email?: string | null;
  businessName?: string;
  businessSlug?: string;
  businessType?: string | null;
  logoUrl?: string | null;
};
export type UserCheckAuth = {
  idUser: number;
  username: string;
  idBusiness: number;
  role: string;
};

export type LoginBody = {
  username: string;
  password: string;
};

export type RegisterBody = {
  name: string;
  username: string;
  email: string;
  password: string;
  businessName: string;
  businessSlug: string;
  businessType: string;
  logoUrl?: string | null;
};

export type AuthUser = {
  idUser: number;
  username: string;
  idBusiness: number;
  role: string;
  // rol?: string;
  // img_url?: string;
};

export type AuthSessionUser = User & {
  name: string;
  username: string;
  email: string | null;
  businessName: string;
  businessSlug: string;
  businessType: string | null;
  logoUrl: string | null;
};

export type AuthSessionResponse = {
  accessToken: string;
  user: AuthSessionUser;
};

export type UserInfoResponse = {
  idUser: number;
  name: string;
  username: string;
  email: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
};

export type UpdatePasswordBody = {
  password: string;
};

export type UpdatePasswordResponse = {
  idUser: number;
  updated: boolean;
};

export type FieldError = {
  field: string;
  message: string;
};

export type AuthValidationResponse = {
  status: boolean;
  message: string;
  errors?: FieldError[];
};
