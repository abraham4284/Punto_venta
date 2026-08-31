export type UserRole = "OWNER" | "ADMIN" | "SELLER";
export type BusinessStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "CANCELLED";

export type BusinessSessionUser = {
  idUser: number;
  idBusiness: number;
  name: string;
  username: string;
  email?: string | null;
  role: UserRole | string;
  businessName: string;
  businessSlug: string;
  businessType: string | null;
  logoUrl: string | null;
  businessStatus: BusinessStatus;
  mustChangePassword: boolean;
  permissions: string[];
};

export type User = BusinessSessionUser;

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
  acceptedTerms: boolean;
  acknowledgedPrivacy: boolean;
};

export type AuthSessionResponse = {
  user: BusinessSessionUser;
};

export type AuthUser = BusinessSessionUser;

export type UserInfoResponse = {
  idUser: number;
  name: string;
  username: string;
  email: string | null;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
};

export type UpdatePasswordBody = {
  currentPassword: string;
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
