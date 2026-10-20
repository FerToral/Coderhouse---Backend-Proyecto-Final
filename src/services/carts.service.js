//@ts-check
import { ProductDTO } from "../dtos/productDTO.js";

function fallo(mensaje, status = 400) {
  return Object.assign(new Error(mensaje), { status });
}

/** Los adaptadores se reciben para probar reglas sin abrir una base real. */
export class CartService {
  constructor({ cartDao, productService, ticketService, transaction }) {
    this.dao = cartDao;
    this.products = productService;
    this.tickets = ticketService;
    this.transaction = transaction;
  }

  async getCartById(cartId) {
    const cart = await this.dao.getCartById(cartId);
    if (!cart) throw fallo("Cart not found", 404);
    return cart;
  }

  async getCartByIdPopulate(cartId, session) {
    const cart = await this.dao.getCartByIdPopulate(cartId, session);
    if (!cart) throw fallo("Cart not found", 404);
    return cart;
  }

  async getPopulatedCartProducts(cartId) {
    const cart = await this.getCartByIdPopulate(cartId);
    return cart.products.map((item) => {
      if (!item.product) throw fallo("Product no longer available", 404);
      return { ...new ProductDTO(item.product), quantity: item.quantity };
    });
  }

  async createCart() {
    return this.dao.createCart();
  }

  async addProductToCart(cartId, productId, purchaser) {
    const product = await this.products.getProductById(productId);
    if (product.owner && product.owner === purchaser)
      throw fallo("Cannot buy your own product", 403);
    if (product.status === false || product.stock < 1)
      throw fallo("Product unavailable", 409);
    await this.getCartById(cartId);
    if (this.dao.addProduct) return this.dao.addProduct(cartId, productId);
    const cart = await this.dao.findAndIncreaseStock(cartId, productId);
    if (!cart) await this.dao.findAndAddProduct(cartId, productId);
  }

  async deleteProductFromCart(cartId, productId) {
    return this.dao.deleteProduct(cartId, productId);
  }

  async updateStockProductoFromCart(cartId, productId, quantity) {
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      throw fallo("Quantity must be a positive integer");
    }
    return this.dao.updateStock(cartId, productId, quantity);
  }

  async emptyCart(cartId) {
    const cart = await this.getCartById(cartId);
    cart.products = [];
    return this.dao.saveCart(cart);
  }

  async updateProductsFromCart(cartId, productsUpdate) {
    if (
      !Array.isArray(productsUpdate) ||
      productsUpdate.some(
        (item) =>
          !item.product ||
          !Number.isSafeInteger(item.quantity) ||
          item.quantity < 1,
      )
    ) {
      throw fallo("Expected products with positive integer quantities");
    }
    if (
      new Set(productsUpdate.map((item) => String(item.product))).size !==
      productsUpdate.length
    ) {
      throw fallo("Duplicate product in cart");
    }
    return this.dao.updateCart(cartId, productsUpdate);
  }

  async purchase(cartId, purchaser) {
    if (typeof purchaser !== "string" || !purchaser.trim()) {
      throw fallo("Purchaser is required", 401);
    }
    if (!this.transaction)
      throw fallo("Transactional checkout unavailable", 503);
    return this.transaction((session) =>
      this.purchaseInTransaction(cartId, purchaser.trim(), session),
    );
  }

  async purchaseInTransaction(cartId, purchaser, session) {
    const cart = await this.getCartByIdPopulate(cartId, session);
    if (!cart.products.length) throw fallo("Cart is empty");

    // Revisar toda la entrada antes de efectuar la primera escritura.
    const available = [];
    const productsNotPurchased = [];
    const seen = new Set();
    let totalAmount = 0;
    for (const item of cart.products) {
      const product = item.product;
      if (!product || !product._id)
        throw fallo("Product no longer available", 404);
      const id = String(product._id);
      if (seen.has(id)) throw fallo("Duplicate product in cart");
      seen.add(id);
      if (product.owner === purchaser)
        throw fallo("Cannot buy your own product", 403);
      if (
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        !Number.isSafeInteger(product.stock) ||
        product.stock < 0 ||
        !Number.isFinite(product.price) ||
        product.price < 0
      ) {
        throw fallo("Invalid quantity, stock or price");
      }
      if (product.stock < item.quantity || product.status === false) {
        productsNotPurchased.push(product._id);
        continue;
      }
      totalAmount += product.price * item.quantity;
      if (
        !Number.isFinite(totalAmount) ||
        totalAmount > Number.MAX_SAFE_INTEGER
      ) {
        throw fallo("Invalid purchase amount");
      }
      available.push(item);
    }

    if (!available.length) return { ticket: null, productsNotPurchased };
    // Mantener el dominio monetario del ecommerce: dos decimales.
    totalAmount = Math.round(totalAmount * 100) / 100;
    for (const item of available) {
      await this.products.reserveStock(
        item.product._id,
        item.quantity,
        session,
      );
    }
    const ticket = await this.tickets.createTicket(
      totalAmount,
      purchaser,
      session,
    );
    const bought = new Set(available.map((item) => String(item.product._id)));
    cart.products = cart.products.filter(
      (item) => !bought.has(String(item.product._id)),
    );
    await this.dao.saveCart(cart, session);
    return { ticket, productsNotPurchased };
  }
}
