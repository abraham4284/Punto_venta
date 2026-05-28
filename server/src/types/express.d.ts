import type {AccessTokenPayload} from "@/libs/tokens.ts"
import type { Request } from "express";


declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: AccessTokenPayload;
}
