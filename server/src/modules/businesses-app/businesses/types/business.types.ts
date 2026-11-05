export interface BusinessDbRow {
  wholesale_enabled: number;
  wholesale_minimum_amount: string | number | null;
  idBusiness: number;
  name: string;
  slug: string;
  logo_url: string | null;
  business_type: string | null;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "CANCELLED";
  is_active: number;
  created_at: Date;
  updated_at: Date | null;
}

export interface BusinessResponse {
  wholesaleEnabled: boolean;
  wholesaleMinimumAmount: number | null;
  idBusiness: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  businessType: string | null;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "CANCELLED";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface UpdateBusinessBody {
  wholesaleEnabled?: boolean;
  wholesaleMinimumAmount?: number | null;
  name?: string;
  slug?: string;
  logoUrl?: string | null;
  businessType?: string;
}
