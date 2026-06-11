export type User = {
  idUser: number;
  idBusiness: number;
  role: string;
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
  username: string;
  password: string;
};

export type AuthUser = {
  idUser: number;
  username: string;
  idBusiness: number;
  role: string;
  // rol?: string;
  // img_url?: string;
};
