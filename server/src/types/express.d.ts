import type {
  AccessTokenPayload,
  BusinessRequestUser,
} from "@/types/auth.types.js";
import type { CurrentBusinessSubscriptionResponse } from "@/modules/platform/subscriptions/types/index.js";
import type { Request } from "express";


declare global {
  namespace Express {
    interface Request {
      auth?: AccessTokenPayload;
      user?: BusinessRequestUser;
      subscription?: CurrentBusinessSubscriptionResponse;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  auth: AccessTokenPayload;
  user: BusinessRequestUser;
}
