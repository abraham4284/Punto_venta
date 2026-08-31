import type { RowDataPacket } from "mysql2";

export type UserRole = "OWNER" | "ADMIN" | "SELLER";
export type BusinessStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "CANCELLED";

export interface AuthUser {
  idUser: number;
  idBusiness: number;
  role: UserRole;
  mustChangePassword?: boolean;
  permissions?: string[];
}

export interface BusinessSessionUser {
  idUser: number;
  idBusiness: number;
  name: string;
  username: string;
  email: string | null;
  role: UserRole;
  businessName: string;
  businessSlug: string;
  businessType: string | null;
  logoUrl: string | null;
  businessStatus: BusinessStatus;
  mustChangePassword: boolean;
  permissions: string[];
}

export interface LoginBody {
  username: string;
  password: string;
}

export interface RegisterBody {
  name: string;
  username: string;
  email?: string | null;
  password: string;
  businessName: string;
  businessSlug: string;
  businessType?: string;
  logoUrl?: string | null;
  acceptedTerms: true;
  acknowledgedPrivacy: true;
}

export interface RegisterDbRow {
  idUser: number;
  idBusiness: number;
  name: string;
  username: string;
  email: string | null;
  businessName: string;
  businessSlug: string;
  businessType: string | null;
  logoUrl: string | null;
  businessStatus: BusinessStatus;
  mustChangePassword: number;
  role: UserRole;
}

export interface UpdatePasswordBody {
  currentPassword: string;
  password: string;
}

export interface UserPasswordHashRow extends RowDataPacket {
  idUser: number;
  password_hash: string;
}

export interface LoginDbRow {
  idUser: number;
  name: string;
  username: string;
  email: string | null;
  password_hash: string;
  user_active: number;
  mustChangePassword: number;
  idBusiness: number;
  business_name: string;
  business_slug: string;
  business_type?: string | null;
  logo_url?: string | null;
  business_active: number;
  business_status: BusinessStatus;
  role: UserRole;
  business_user_active: number;
}

export interface SessionDbRow {
  idLogin: number;
  refresh_token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  idUser: number;
  name: string;
  email: string;
  idBusiness: number;
  role: UserRole;
}

export interface UserInfoResponse {
  idUser: number;
  name: string;
  username: string;
  email: string | null;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
}

export interface UserInfoDbRow {
  idUser: number;
  name: string;
  username: string;
  email: string | null;
  role: UserRole;
  isActive: number;
  mustChangePassword: number;
  createdAt: Date;
}

export interface AuthenticatedUserContextDbRow {
  idUser: number;
  idBusiness: number;
  name: string;
  username: string;
  email: string | null;
  role: UserRole;
  businessName: string;
  businessSlug: string;
  businessType: string | null;
  logoUrl: string | null;
  businessStatus: BusinessStatus;
  mustChangePassword: number;
}

export type AuthenticatedUserContext = BusinessSessionUser;
