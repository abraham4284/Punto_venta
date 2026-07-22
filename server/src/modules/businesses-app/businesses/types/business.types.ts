export interface BusinessDbRow {
  idBusiness: number;
  name: string;
  slug: string;
  logo_url: string | null;
  business_type: string | null;
  is_active: number;
  created_at: Date;
  updated_at: Date | null;
}

export interface BusinessResponse {
  idBusiness: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  businessType: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface UpdateBusinessBody {
  name?: string;
  slug?: string;
  logoUrl?: string | null;
  businessType?: string;
}
