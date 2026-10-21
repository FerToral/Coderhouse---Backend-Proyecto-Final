import { Store, positiveId, missing } from "./store.js";
export class CartManager {
  constructor(filename, products) {
    this.store = new Store(filename);
    this.products = products;
  }
  createCart() {
    return this.store.run((state) => {
      const cart = { id: ++state.lastId, products: [] };
      state.items.push(cart);
      return cart;
    }, true);
  }
  getCartById(id) {
    id = positiveId(id);
    return this.store.run(
      (state) =>
        state.items.find((c) => Number(c.id) === id) ||
        (() => {
          throw missing("Cart");
        })(),
    );
  }
  async addProductToCart(cid, pid) {
    cid = positiveId(cid);
    pid = positiveId(pid);
    await this.products.getProductById(pid);
    return this.store.run((state) => {
      const cart = state.items.find((c) => Number(c.id) === cid);
      if (!cart) throw missing("Cart");
      const item = cart.products.find((p) => p.product === pid);
      if (item) item.quantity += 1;
      else cart.products.push({ product: pid, quantity: 1 });
      return cart;
    }, true);
  }
}
