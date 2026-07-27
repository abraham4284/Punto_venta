import { Router } from "express";
import platformAuthRoutes from "./auth/index.js";
import platformSubscriptionRoutes from "./subscriptions/index.js";

const platformRoutes = Router();
platformRoutes.use("/platform", platformAuthRoutes);
platformRoutes.use("/platform", platformSubscriptionRoutes);

export default platformRoutes;
