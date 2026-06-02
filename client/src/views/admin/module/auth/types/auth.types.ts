export type User = {
  idUser: number;
  username: string;
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
  // rol?: string;
  // img_url?: string;
};