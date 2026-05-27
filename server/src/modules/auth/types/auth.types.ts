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

