import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { startTestDatabase } from "../helpers/mongo.js";
import { ProductsModel } from "../../src/dao/models/products.model.js";
import { CartsModel } from "../../src/dao/models/carts.model.js";
import { TicketModel } from "../../src/dao/models/tickets.model.js";
import { cartService } from "../../src/utils/main.js";
import { CartService } from "../../src/services/carts.service.js";
let stop;
before(
  async () => {
    stop = await startTestDatabase();
    await Promise.all([
      ProductsModel.init(),
      CartsModel.init(),
      TicketModel.init(),
    ]);
  },
  { timeout: 180000 },
);
after(async () => {
  if (stop) await stop();
});
beforeEach(async () => {
  await Promise.all([
    ProductsModel.deleteMany({}),
    CartsModel.deleteMany({}),
    TicketModel.deleteMany({}),
  ]);
});
async function product(stock = 3, price = 12) {
  return ProductsModel.create({
    title: "Cuaderno",
    description: "Prueba aislada",
    code: crypto.randomUUID(),
    price,
    stock,
    category: "papelería",
    status: true,
    thumbnails: [],
  });
}
async function cart(p, quantity = 1) {
  return CartsModel.create({ products: [{ product: p._id, quantity }] });
}
test("Mongo: compra completa confirma ticket, stock y carrito juntos", async () => {
  const p = await product(),
    c = await cart(p, 2);
  const result = await cartService.purchase(c._id, "student@example.test");
  assert.equal(result.ticket.amount, 24);
  assert.equal((await ProductsModel.findById(p._id)).stock, 1);
  assert.equal((await CartsModel.findById(c._id)).products.length, 0);
  assert.equal(await TicketModel.countDocuments(), 1);
});
test("Mongo: compra parcial conserva sin descuento lo no disponible", async () => {
  const p = await product(1),
    q = await product(4, 5);
  const c = await CartsModel.create({
    products: [
      { product: p._id, quantity: 2 },
      { product: q._id, quantity: 3 },
    ],
  });
  const result = await cartService.purchase(c._id, "student@example.test");
  assert.equal(result.ticket.amount, 15);
  assert.deepEqual(result.productsNotPurchased.map(String), [String(p._id)]);
  assert.equal((await ProductsModel.findById(p._id)).stock, 1);
  assert.equal((await CartsModel.findById(c._id)).products.length, 1);
});
test("Mongo: fallo del ticket revierte el descuento de stock", async () => {
  const p = await product(),
    c = await cart(p, 2);
  const failing = new CartService({
    cartDao: cartService.dao,
    productService: cartService.products,
    ticketService: {
      createTicket: async () => {
        throw new Error("simulated ticket failure");
      },
    },
    transaction: cartService.transaction,
  });
  await assert.rejects(
    failing.purchase(c._id, "student@example.test"),
    /simulated/,
  );
  assert.equal((await ProductsModel.findById(p._id)).stock, 3);
  assert.equal((await CartsModel.findById(c._id)).products[0].quantity, 2);
  assert.equal(await TicketModel.countDocuments(), 0);
});
test("Mongo: fallo al guardar carrito también revierte ticket y stock", async () => {
  const p = await product(),
    c = await cart(p);
  const failing = new CartService({
    cartDao: {
      getCartByIdPopulate: cartService.dao.getCartByIdPopulate,
      saveCart: async () => {
        throw new Error("simulated cart failure");
      },
    },
    productService: cartService.products,
    ticketService: cartService.tickets,
    transaction: cartService.transaction,
  });
  await assert.rejects(
    failing.purchase(c._id, "student@example.test"),
    /simulated/,
  );
  assert.equal((await ProductsModel.findById(p._id)).stock, 3);
  assert.equal(await TicketModel.countDocuments(), 0);
  assert.equal((await CartsModel.findById(c._id)).products.length, 1);
});
test("Mongo: dos compradores simultáneos no venden la última unidad dos veces", async () => {
  const p = await product(1),
    a = await cart(p),
    b = await cart(p);
  const results = await Promise.all([
    cartService.purchase(a._id, "a@example.test"),
    cartService.purchase(b._id, "b@example.test"),
  ]);
  assert.equal(results.filter((r) => r.ticket).length, 1);
  assert.equal((await ProductsModel.findById(p._id)).stock, 0);
  assert.equal(await TicketModel.countDocuments(), 1);
  assert.equal(
    (await CartsModel.find({})).reduce((n, c) => n + c.products.length, 0),
    1,
  );
});
test("Mongo: doble confirmación del mismo carrito no crea dos tickets", async () => {
  const p = await product(4),
    c = await cart(p);
  const results = await Promise.allSettled([
    cartService.purchase(c._id, "a@example.test"),
    cartService.purchase(c._id, "a@example.test"),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(await TicketModel.countDocuments(), 1);
  assert.equal((await ProductsModel.findById(p._id)).stock, 3);
});
test("Mongo: el dueño no compra su propio producto aunque llegue por PUT del carrito", async () => {
  const p = await product(),
    c = await cart(p);
  await ProductsModel.updateOne(
    { _id: p._id },
    { owner: "student@example.test" },
  );
  await assert.rejects(cartService.purchase(c._id, "student@example.test"), {
    status: 403,
  });
  assert.equal(await TicketModel.countDocuments(), 0);
  assert.equal((await ProductsModel.findById(p._id)).stock, 3);
});
