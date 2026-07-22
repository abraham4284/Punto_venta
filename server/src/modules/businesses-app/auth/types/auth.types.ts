// import type { Request } from "express";

export type UserRole = "OWNER" | "ADMIN" | "SELLER";

export interface AuthUser {
  idUser: number;
  idBusiness: number;
  role: UserRole;
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
  role: UserRole;
}

export interface UpdatePasswordBody {
  password: string;
}

export interface LoginDbRow {
  idUser: number;
  name: string;
  username: string;
  email: string | null;
  password_hash: string;
  user_active: number;
  idBusiness: number;
  business_name: string;
  business_slug: string;
  business_active: number;
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
  createdAt: Date;
}

export interface UserInfoDbRow {
  idUser: number;
  name: string;
  username: string;
  email: string | null;
  role: UserRole;
  isActive: number;
  createdAt: Date;
}

