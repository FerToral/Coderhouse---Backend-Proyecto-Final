//@ts-check
import { cartService, productService } from "../utils/main.js";
import { TicketModel } from "../dao/models/tickets.model.js";
import { UserModel } from "../dao/models/users.model.js";

class CartController {
  constructor() {}
  async renderReceipt(req, res, next) {
    try {
      const ticket = await TicketModel.findOne({
        code: req.params.code,
        purchaser: req.session.user.email,
      }).lean();
      if (!ticket)
        return res.status(404).render("error-page", {
          msg: "No encontramos ese comprobante en tu cuenta.",
        });
      return res.render("receipt", {
        title: "Compra confirmada · CityCode",
        ticket,
        cartId: req.params.cid,
        date: new Date(ticket.purchase_datetime).toLocaleString("es-AR"),
        partial: req.query.partial === "1",
      });
    } catch (err) {
      next(err);
    }
  }
  async renderCart(req, res) {
    const cartId = req.params.cid;
    try {
      const cartProducts = await cartService.getPopulatedCartProducts(cartId);
      const rows = cartProducts.map((product) => ({
        ...product,
        subtotal: product.price * product.quantity,
      }));
      return res.render("cart", {
        title: "Mi carrito · CityCode",
        cartId,
        cartProducts: rows,
        total: rows.reduce((sum, p) => sum + p.subtotal, 0),
      });
    } catch (error) {
      return res.status(404).render("error-page", { error: error.message });
    }
  }
  async getCart(req, res) {
    const cartId = req.params.cid;
    try {
      const cartFound = await cartService.getCartByIdPopulate(cartId);
      return res.status(200).json({ status: "success", data: cartFound });
    } catch (error) {
      res
        .status(404)
        .json({ status: "error", data: `Cart not found. ${error.message}` });
    }
  }
  async postCart(req, res) {
    try {
      if (req.session.user.rol === "admin")
        return res
          .status(403)
          .json({ status: "error", msg: "Administrators cannot buy" });
      if (req.session.user.cart)
        return res
          .status(200)
          .json({
            status: "success",
            data: await cartService.getCartById(req.session.user.cart),
          });
      const newCartMongo = await cartService.createCart();
      await UserModel.updateOne(
        { _id: req.session.user._id },
        { cart: String(newCartMongo._id) },
      );
      req.session.user.cart = String(newCartMongo._id);
      res.status(201).json({ status: "success", data: newCartMongo });
    } catch (error) {
      res.status(400).json({ status: "error", data: "Error creating cart" });
    }
  }

  async addProductToCart(req, res) {
    const cartId = req.params.cid;
    const prodId = req.params.pid;

    try {
      const productFound = await productService.getProductById(prodId);
      await cartService.addProductToCart(
        cartId,
        prodId,
        req.session.user.email,
      );
      return res.status(201).json({
        status: "success",
        data: `${productFound} product correctly added`,
      });
    } catch (error) {
      res
        .status(error.status || 400)
        .json({ status: "error", data: error.message });
    }
  }

  async deleteProduct(req, res) {
    const { cid, pid } = req.params;

    try {
      const result = await cartService.deleteProductFromCart(cid, pid);
      if (!result)
        return res.status(200).json({
          status: "success",
          data: `Product is no longer in the cart.`,
        });
      res.status(200).json({
        status: "success",
        data: `Product removed from cart. ${result}`,
      });
    } catch (error) {
      res.status(404).json({ status: "error", data: error.message });
    }
  }

  async deleteCart(req, res) {
    const cId = req.params.cid;

    try {
      await cartService.emptyCart(cId);
      res.status(200).json({ status: "success", data: `Cart emptied` });
    } catch (error) {
      res
        .status(error.status || 400)
        .json({ status: "error", data: error.message });
    }
  }

  async putCart(req, res) {
    const cId = req.params.cid;
    const pUpdate = req.body;

    try {
      const result = await cartService.updateProductsFromCart(cId, pUpdate);
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      res.status(404).json({ status: "error", data: error.message });
    }
  }

  async putStock(req, res) {
    const { cid, pid } = req.params;
    const stockUpdate = Number(req.body.quantity ?? req.body.stock);

    try {
      const result = await cartService.updateStockProductoFromCart(
        cid,
        pid,
        stockUpdate,
      );
      res.status(200).json({ status: "success", data: result });
    } catch (error) {
      res
        .status(error.status || 400)
        .json({ status: "error", data: error.message });
    }
  }

  async purchase(req, res) {
    const cartId = req.params.cid;
    try {
      const { ticket, productsNotPurchased } = await cartService.purchase(
        cartId,
        req.session?.user?.email,
      );

      return res.status(ticket ? 201 : 200).json({
        status: "success",
        msg: "Purchase completed",
        ticket,
        productsNotPurchased,
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        status: "error",
        msg: `An error occurred during the purchase process. ${error}`,
      });
    }
  }
}

export const cartController = new CartController();
