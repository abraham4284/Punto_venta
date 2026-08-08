import { Router } from "express";
import platformAuthRoutes from "./auth/index.js";
import platformSubscriptionRoutes from "./subscriptions/index.js";
import platformDashboardRoutes from "./dashboard/index.js";
import platformBusinessRoutes from "./businesses/index.js";
import platformAuditRoutes from "./audit/index.js";
import platformUserRoutes from "./users/index.js";
import platformNotificationRoutes from "./notifications/index.js";

const platformRoutes = Router();
platformRoutes.use("/platform", platformAuthRoutes);
platformRoutes.use("/platform", platformDashboardRoutes);
platformRoutes.use("/platform", platformBusinessRoutes);
platformRoutes.use("/platform", platformSubscriptionRoutes);
platformRoutes.use("/platform", platformAuditRoutes);
platformRoutes.use("/platform", platformUserRoutes);
platformRoutes.use("/platform", platformNotificationRoutes);

export default platformRoutes;
