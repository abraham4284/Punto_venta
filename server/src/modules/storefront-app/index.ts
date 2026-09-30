import { Router } from "express";
import catalogRoutes from "./catalog/index.js";

const storefrontAppRoutes = Router();

storefrontAppRoutes.use(catalogRoutes);

export { catalogRoutes };

export default storefrontAppRoutes;
