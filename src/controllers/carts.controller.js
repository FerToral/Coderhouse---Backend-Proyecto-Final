import { cartService } from "../utils/main.js";
import { TicketModel } from "../dao/models/tickets.model.js";
import { UserModel } from "../dao/models/users.model.js";

class CartController {
  async renderReceipt(req, res, next) {
    try {
      const ticket = await TicketModel.findOne({
        code: req.params.code,
        purchaser: req.session.user.email,
      }).lean();
      if (!ticket)
        return res
          .status(404)
          .render("error-page", {
            msg: "No encontramos ese comprobante en tu cuenta.",
          });
      return res.render("receipt", {
        title: "Compra confirmada · CityCode",
        ticket,
        cartId: req.params.cid,
        date: new Date(ticket.purchase_datetime).toLocaleString("es-AR"),
        partial: req.query.partial === "1",
      });
    } catch (error) {
      next(error);
    }
  }
  async renderCart(req, res, next) {
    try {
      const rows = (
        await cartService.getPopulatedCartProducts(req.params.cid)
      ).map((product) => ({
        ...product,
        subtotal: product.price * product.quantity,
      }));
      return res.render("cart", {
        title: "Mi carrito · CityCode",
        cartId: req.params.cid,
        cartProducts: rows,
        total: rows.reduce((sum, p) => sum + p.subtotal, 0),
      });
    } catch (error) {
      next(error);
    }
  }
  async getCart(req, res, next) {
    try {
      res.json({
        status: "success",
        data: await cartService.getCartByIdPopulate(req.params.cid),
      });
    } catch (error) {
      next(error);
    }
  }
  async postCart(req, res, next) {
    try {
      if (req.session.user.rol === "admin")
        return res
          .status(403)
          .json({ status: "error", msg: "Administrators cannot buy" });
      if (req.session.user.cart)
        return res.json({
          status: "success",
          data: await cartService.getCartById(req.session.user.cart),
        });
      const cart = await cartService.createCart();
      await UserModel.updateOne(
        { _id: req.session.user._id },
        { cart: String(cart._id) },
      );
      req.session.user.cart = String(cart._id);
      res.status(201).json({ status: "success", data: cart });
    } catch (error) {
      next(error);
    }
  }
  async addProductToCart(req, res, next) {
    try {
      await cartService.addProductToCart(
        req.params.cid,
        req.params.pid,
        req.session.user.email,
      );
      res.status(201).json({ status: "success", data: "Product added" });
    } catch (error) {
      next(error);
    }
  }
  async deleteProduct(req, res, next) {
    try {
      await cartService.deleteProductFromCart(req.params.cid, req.params.pid);
      res.json({ status: "success", data: "Product removed from cart" });
    } catch (error) {
      next(error);
    }
  }
  async deleteCart(req, res, next) {
    try {
      await cartService.emptyCart(req.params.cid);
      res.json({ status: "success", data: "Cart emptied" });
    } catch (error) {
      next(error);
    }
  }
  async putCart(req, res, next) {
    try {
      const result = await cartService.updateProductsFromCart(
        req.params.cid,
        req.body,
      );
      res.json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }
  async putStock(req, res, next) {
    try {
      const result = await cartService.updateStockProductoFromCart(
        req.params.cid,
        req.params.pid,
        Number(req.body.quantity ?? req.body.stock),
      );
      res.json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }
  async purchase(req, res, next) {
    try {
      const { ticket, productsNotPurchased } = await cartService.purchase(
        req.params.cid,
        req.session?.user?.email,
      );
      res
        .status(ticket ? 201 : 200)
        .json({
          status: "success",
          msg: "Purchase completed",
          ticket,
          productsNotPurchased,
        });
    } catch (error) {
      next(error);
    }
  }
}
export const cartController = new CartController();
