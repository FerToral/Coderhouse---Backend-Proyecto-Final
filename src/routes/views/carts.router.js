//@ts-check
import express from "express";
import { cartController } from "../../controllers/carts.controller.js";
import { checkUser } from "../../middlewares/auth.js";
import { requireCartOwner } from "../../middlewares/cart-owner.js";

const cartsRouter = express.Router();

cartsRouter.get(
  "/:cid",
  checkUser,
  requireCartOwner,
  cartController.renderCart,
);
cartsRouter.get(
  "/:cid/tickets/:code",
  checkUser,
  requireCartOwner,
  cartController.renderReceipt,
);

export default cartsRouter;
