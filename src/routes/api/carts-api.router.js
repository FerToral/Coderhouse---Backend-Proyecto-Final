//@ts-check

import { Router } from "express";
import { cartController } from "../../controllers/carts.controller.js";
import { requireCartOwner } from "../../middlewares/cart-owner.js";

const cartsApiRouter = Router();
cartsApiRouter.use("/:cid", requireCartOwner);

cartsApiRouter.get("/:cid", cartController.getCart);

cartsApiRouter.post("/", cartController.postCart);

cartsApiRouter.post("/:cid/products/:pid", cartController.addProductToCart);

cartsApiRouter.delete("/:cid/products/:pid", cartController.deleteProduct);

cartsApiRouter.delete("/:cid", cartController.deleteCart);

cartsApiRouter.put("/:cid", cartController.putCart);

cartsApiRouter.put("/:cid/products/:pid", cartController.putStock);

cartsApiRouter.post("/:cid/purchase", cartController.purchase);
// Compatibilidad con los clientes históricos que utilizaban PUT.
cartsApiRouter.put("/:cid/purchase", cartController.purchase);

export default cartsApiRouter;
