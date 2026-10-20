import { Router } from "express";
import { paginationMiddleware } from "../../middlewares/mw-routerproducts.js";
import { productController } from "../../controllers/products.controller.js";
const router = Router();
router.get(
  "/realtimeproducts",
  paginationMiddleware,
  productController.renderPaginationProducts,
);
router.get(
  "/",
  paginationMiddleware,
  productController.renderPaginationProducts,
);
router.get("/:pid", productController.renderProduct);
export default router;
