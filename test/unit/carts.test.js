import { test } from "node:test";
import assert from "node:assert/strict";
import { CartService } from "../../src/services/carts.service.js";
import { requireCartOwner } from "../../src/middlewares/cart-owner.js";

function fixture(items = [], missing = false) {
  const cart = { products: structuredClone(items) };
  const calls = { stocks: [], tickets: [], saves: [] };
  const dao = {
    getCartById: async () => (missing ? null : cart),
    getCartByIdPopulate: async () => (missing ? null : cart),
    saveCart: async (value) => {
      calls.saves.push(value);
      return value;
    },
    deleteProduct: async (_, id) => {
      cart.products = cart.products.filter((item) => item.product._id !== id);
    },
    updateStock: async (...args) => args,
  };
  const service = new CartService({
    cartDao: dao,
    transaction: (work) => work(null),
    productService: {
      reserveStock: async (id, quantity) => {
        const entry = cart.products.find((item) => item.product._id === id);
        calls.stocks.push({ id, stock: entry.product.stock - quantity });
      },
    },
    ticketService: {
      createTicket: async (amount, purchaser) => {
        const ticket = { code: "TEST-1", amount, purchaser };
        calls.tickets.push(ticket);
        return ticket;
      },
    },
  });
  return { service, cart, calls };
}
const item = (id, stock, quantity, price = 10) => ({
  product: { _id: id, title: id, stock, price, status: true },
  quantity,
});

test("compra completa: stock, ticket y carrito vacío", async () => {
  const f = fixture([item("a", 5, 2), item("b", 1, 1, 4)]);
  const result = await f.service.purchase("cart", "cliente@example.com");
  assert.deepEqual(f.calls.stocks, [
    { id: "a", stock: 3 },
    { id: "b", stock: 0 },
  ]);
  assert.equal(result.ticket.amount, 24);
  assert.equal(result.ticket.purchaser, "cliente@example.com");
  assert.deepEqual(result.productsNotPurchased, []);
  assert.deepEqual(f.cart.products, []);
});
test("compra parcial: conserva sin tocar lo que no tiene stock", async () => {
  const f = fixture([item("a", 1, 2), item("b", 5, 2, 3)]);
  const result = await f.service.purchase("cart", "cliente@example.com");
  assert.deepEqual(result.productsNotPurchased, ["a"]);
  assert.deepEqual(f.calls.stocks, [{ id: "b", stock: 3 }]);
  assert.equal(result.ticket.amount, 6);
  assert.deepEqual(
    f.cart.products.map((x) => x.product._id),
    ["a"],
  );
});
test("sin stock no genera ticket ni modifica productos", async () => {
  const f = fixture([item("a", 0, 1)]);
  const result = await f.service.purchase("cart", "cliente@example.com");
  assert.equal(result.ticket, null);
  assert.deepEqual(result.productsNotPurchased, ["a"]);
  assert.equal(f.calls.stocks.length, 0);
  assert.equal(f.calls.tickets.length, 0);
  assert.equal(f.cart.products.length, 1);
});
test("un producto deshabilitado no se compra", async () => {
  const product = item("a", 5, 1);
  product.product.status = false;
  const f = fixture([product]);
  assert.deepEqual(
    (await f.service.purchase("cart", "c@example.com")).productsNotPurchased,
    ["a"],
  );
  assert.equal(f.calls.stocks.length, 0);
});
test("el comprador es explícito, no una variable req inexistente", async () => {
  const f = fixture([item("a", 2, 1)]);
  await assert.rejects(f.service.purchase("cart"), { status: 401 });
  assert.equal(f.calls.stocks.length, 0);
});
test("carrito vacío no crea una compra de cero", async () => {
  const f = fixture();
  await assert.rejects(f.service.purchase("cart", "c@example.com"), /empty/);
  assert.equal(f.calls.tickets.length, 0);
});
test("carrito inexistente rechaza, en lugar de devolver una función", async () => {
  const f = fixture([], true);
  await assert.rejects(f.service.getCartById("missing"), { status: 404 });
  await assert.rejects(f.service.getCartByIdPopulate("missing"), {
    status: 404,
  });
});
test("datos inválidos se rechazan antes de cualquier escritura", async () => {
  for (const [stock, quantity, price] of [
    [-1, 1, 2],
    [2, 0, 2],
    [2, 1.5, 2],
    [2, 1, -1],
    [2, 1, Infinity],
  ]) {
    const f = fixture([
      item("valid", 2, 1),
      item("bad", stock, quantity, price),
    ]);
    await assert.rejects(f.service.purchase("cart", "c@example.com"));
    assert.equal(f.calls.stocks.length, 0);
  }
});
test("producto eliminado no causa una compra parcial accidental", async () => {
  const f = fixture([item("valid", 2, 1), { product: null, quantity: 1 }]);
  await assert.rejects(f.service.purchase("cart", "c@example.com"), {
    status: 404,
  });
  assert.equal(f.calls.stocks.length, 0);
});
test("entradas duplicadas del mismo producto se rechazan", async () => {
  const f = fixture([item("a", 2, 1), item("a", 2, 1)]);
  await assert.rejects(
    f.service.purchase("cart", "c@example.com"),
    /Duplicate/,
  );
  assert.equal(f.calls.stocks.length, 0);
});
test("importe no finito o desbordado se rechaza", async () => {
  const f = fixture([item("a", 2, 2, Number.MAX_SAFE_INTEGER)]);
  await assert.rejects(f.service.purchase("cart", "c@example.com"), /amount/);
  assert.equal(f.calls.stocks.length, 0);
});
test("el ticket conserva dos decimales monetarios", async () => {
  const f = fixture([item("a", 3, 3, 0.1)]);
  assert.equal(
    (await f.service.purchase("cart", "c@example.com")).ticket.amount,
    0.3,
  );
});
test("vaciar el carrito entrega el documento a saveCart", async () => {
  const f = fixture([item("a", 1, 1)]);
  await f.service.emptyCart("cart");
  assert.equal(f.calls.saves[0], f.cart);
  assert.deepEqual(f.cart.products, []);
});
test("la vista usa el producto poblado y su cantidad", async () => {
  const f = fixture([item("a", 3, 2, 12)]);
  const products = await f.service.getPopulatedCartProducts("cart");
  assert.equal(products[0].title, "a");
  assert.equal(products[0].price, 12);
  assert.equal(products[0].quantity, 2);
});
test("actualizar cantidad exige entero positivo", async () => {
  const f = fixture();
  await assert.rejects(f.service.updateStockProductoFromCart("cart", "a", 0));
  assert.deepEqual(
    await f.service.updateStockProductoFromCart("cart", "a", 2),
    ["cart", "a", 2],
  );
});
test("si falla el ticket no se vacía el carrito", async () => {
  const f = fixture([item("a", 2, 1)]);
  f.service.tickets.createTicket = async () => {
    throw new Error("ticket unavailable");
  };
  await assert.rejects(f.service.purchase("cart", "c@example.com"));
  assert.equal(f.cart.products.length, 1);
  // El rollback de stock requiere una transacción Mongo real; no se certifica aquí.
});
test("propiedad del carrito: sesión ausente, ajena y propia", () => {
  for (const [user, expected] of [
    [null, 401],
    [{ email: "c@example.com", cart: "other" }, 403],
    [{ email: "admin@example.com", cart: "cart", rol: "admin" }, 403],
    [{ email: "c@example.com", cart: "cart" }, 0],
  ]) {
    let status = 0,
      next = 0;
    const res = {
      status(n) {
        status = n;
        return this;
      },
      json() {
        return this;
      },
    };
    requireCartOwner(
      { session: { user }, params: { cid: "cart" } },
      res,
      () => {
        next++;
      },
    );
    assert.equal(status, expected);
    assert.equal(next, expected === 0 ? 1 : 0);
  }
});
