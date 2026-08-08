import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requireBusinessContext } from "@/middlewares/requireBusinessContext.middleware.js";
import {
  archiveNotificationController,
  getNotificationsController,
  getUnreadNotificationCountController,
  markAllNotificationsReadController,
  markNotificationReadController,
} from "../controllers/notifications.controller.js";

const router = Router();

router.get(
  "/notifications",
  requireAuth,
  requireBusinessContext,
  getNotificationsController,
);
router.get(
  "/notifications/unread-count",
  requireAuth,
  requireBusinessContext,
  getUnreadNotificationCountController,
);
router.patch(
  "/notifications/:idNotification/read",
  requireAuth,
  requireBusinessContext,
  markNotificationReadController,
);
router.patch(
  "/notifications/read-all",
  requireAuth,
  requireBusinessContext,
  markAllNotificationsReadController,
);
router.patch(
  "/notifications/:idNotification/archive",
  requireAuth,
  requireBusinessContext,
  archiveNotificationController,
);

export default router;
