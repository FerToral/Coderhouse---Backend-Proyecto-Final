import { CartsModel } from "../models/carts.model.js";

class CartDAO {
  async addProduct(cartId, productId) {
    const inserted = await CartsModel.findOneAndUpdate(
      { _id: cartId, "products.product": { $ne: productId } },
      { $push: { products: { product: productId, quantity: 1 } } },
      { new: true },
    );
    if (inserted) return inserted;
    return this.findAndIncreaseStock(cartId, productId);
  }

  async getCartById(cartId) {
    return await CartsModel.findOne({ _id: cartId });
  }

  async getCartByIdPopulate(cartId, session) {
    const cartFound = await CartsModel.findById({ _id: cartId })
      .session(session || null)
      .populate("products.product");
    return cartFound;
  }

  async createCart() {
    const newCart = await CartsModel.create({ products: [] });
    return newCart;
  }

  async findAndIncreaseStock(cartId, productId) {
    return await CartsModel.findOneAndUpdate(
      { _id: cartId, "products.product": productId },
      { $inc: { "products.$.quantity": 1 } },
      { new: true },
    );
  }

  async findAndAddProduct(cId, pId) {
    await CartsModel.findOneAndUpdate(
      { _id: cId },
      { $push: { products: { product: pId, quantity: 1 } } },
      { new: true },
    );
  }

  async deleteProduct(cId, pId) {
    return await CartsModel.findOneAndUpdate(
      { _id: cId, "products.product": pId },
      { $pull: { products: { product: pId } } },
    );
  }

  async updateStock(cId, pId, stockUpdate) {
    return CartsModel.updateOne(
      { _id: cId, "products.product": pId },
      { $set: { "products.$.quantity": stockUpdate } },
    );
  }

  async saveCart(cart, session) {
    return await cart.save({ session });
  }

  async updateCart(cartId, productsUpdate) {
    return await CartsModel.updateOne(
      { _id: cartId },
      { $set: { products: productsUpdate } },
      { runValidators: true },
    );
  }
}

const cartDao = new CartDAO();

export default cartDao;
