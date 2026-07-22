import { Router } from "express";
import platformAuthRoutes from "./auth/index.js";

const platformRoutes = Router();
platformRoutes.use("/platform", platformAuthRoutes);

export default platformRoutes;
