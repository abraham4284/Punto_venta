import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requirePlatformContext } from "@/middlewares/requirePlatformContext.middleware.js";
import {
  archivePlatformNotificationController,
  getPlatformNotificationsController,
  getPlatformUnreadNotificationCountController,
  markAllPlatformNotificationsReadController,
  markPlatformNotificationReadController,
} from "../controllers/notifications.controller.js";

const router = Router();

router.get(
  "/notifications",
  requireAuth,
  requirePlatformContext,
  getPlatformNotificationsController,
);
router.get(
  "/notifications/unread-count",
  requireAuth,
  requirePlatformContext,
  getPlatformUnreadNotificationCountController,
);
router.patch(
  "/notifications/:idNotification/read",
  requireAuth,
  requirePlatformContext,
  markPlatformNotificationReadController,
);
router.patch(
  "/notifications/read-all",
  requireAuth,
  requirePlatformContext,
  markAllPlatformNotificationsReadController,
);
router.patch(
  "/notifications/:idNotification/archive",
  requireAuth,
  requirePlatformContext,
  archivePlatformNotificationController,
);

export default router;
