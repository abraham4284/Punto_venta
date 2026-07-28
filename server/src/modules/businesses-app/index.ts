import { Router } from "express";
import { requireAuth } from "@/middlewares/requireAuth.js";
import { requireBusinessContext } from "@/middlewares/requireBusinessContext.middleware.js";
import { requireOperationalSubscription } from "@/middlewares/requireOperationalSubscription.middleware.js";

import authRoutes from "./auth/index.js";
import businessRoutes from "./businesses/index.js";
import businessUserRoutes from "./business-users/index.js";
import customerRoutes from "./customers/index.js";
import dashboardRoutes from "./dashboard/index.js";
import depositRoutes from "./deposits/index.js";
import productCategoryRoutes from "./product-categories/index.js";
import productRoutes from "./products/index.js";
import permissionRoutes from "./permissions/index.js";
import purchaseRoutes from "./purchases/index.js";
import saleRoutes from "./sales/index.js";
import stockRoutes from "./stock/index.js";
import stockMovementRoutes from "./stock_movements/index.js";
import subscriptionRoutes from "./subscription/index.js";
import supplierRoutes from "./suppliers/index.js";
import ticketRoutes from "./tickets/index.js";

const businessesAppRoutes = Router();

businessesAppRoutes.use(function skipPlatformRoutes(req, _res, next) {
  if (req.path.startsWith("/platform")) {
    next("router");
    return;
  }

  next();
});

businessesAppRoutes.use(authRoutes);
businessesAppRoutes.use(businessRoutes);
businessesAppRoutes.use(subscriptionRoutes);
businessesAppRoutes.use(
  requireAuth,
  requireBusinessContext,
  requireOperationalSubscription,
);
businessesAppRoutes.use(customerRoutes);
businessesAppRoutes.use(permissionRoutes);
businessesAppRoutes.use(businessUserRoutes);
businessesAppRoutes.use(dashboardRoutes);
businessesAppRoutes.use(depositRoutes);
businessesAppRoutes.use(productCategoryRoutes);
businessesAppRoutes.use(productRoutes);
businessesAppRoutes.use(purchaseRoutes);
businessesAppRoutes.use(saleRoutes);
businessesAppRoutes.use(stockRoutes);
businessesAppRoutes.use(stockMovementRoutes);
businessesAppRoutes.use(supplierRoutes);
businessesAppRoutes.use(ticketRoutes);

export {
  authRoutes,
  businessRoutes,
  businessUserRoutes,
  customerRoutes,
  dashboardRoutes,
  depositRoutes,
  productCategoryRoutes,
  productRoutes,
  permissionRoutes,
  purchaseRoutes,
  saleRoutes,
  stockRoutes,
  stockMovementRoutes,
  subscriptionRoutes,
  supplierRoutes,
  ticketRoutes,
};

export default businessesAppRoutes;
