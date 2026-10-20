//@ts-check
import { Router } from "express";
import {
  paginationMiddleware,
  validationProduct,
  mayCreateProduct,
  mayModifyProduct,
} from "../../middlewares/mw-routerproducts.js";
import { productController } from "../../controllers/products.controller.js";

const productsApiRouter = Router();

productsApiRouter.get(
  "/",
  paginationMiddleware,
  productController.getPagination,
);

productsApiRouter.get("/:pid", productController.getProduct);

productsApiRouter.post(
  "/",
  mayCreateProduct,
  validationProduct,
  productController.post,
);

productsApiRouter.put("/:pid", mayModifyProduct, productController.put);

productsApiRouter.delete("/:pid", mayModifyProduct, productController.delete);

export default productsApiRouter;
