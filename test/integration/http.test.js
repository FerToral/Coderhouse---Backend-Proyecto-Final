import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { randomBytes } from "node:crypto";
import { startTestDatabase } from "../helpers/mongo.js";
import { UserModel } from "../../src/dao/models/users.model.js";
import { ProductsModel } from "../../src/dao/models/products.model.js";
import { CartsModel } from "../../src/dao/models/carts.model.js";
import { TicketModel } from "../../src/dao/models/tickets.model.js";
process.env.NODE_ENV = "test";
const { createApp } = await import("../../src/app.js");
let stop, app;
before(
  async () => {
    stop = await startTestDatabase();
    await Promise.all([
      UserModel.init(),
      ProductsModel.init(),
      CartsModel.init(),
      TicketModel.init(),
    ]);
    app = createApp({ sessionSecret: randomBytes(32).toString("hex") });
  },
  { timeout: 180000 },
);
after(async () => {
  if (stop) await stop();
});
beforeEach(async () => {
  await Promise.all([
    UserModel.deleteMany({}),
    ProductsModel.deleteMany({}),
    CartsModel.deleteMany({}),
    TicketModel.deleteMany({}),
  ]);
});
const sample = (extra = {}) => ({
  title: "Cuaderno",
  description: "Papel para ideas",
  code: crypto.randomUUID(),
  price: 1200,
  stock: 3,
  category: "papelería",
  thumbnails: [],
  status: true,
  ...extra,
});
async function account(email = "student@example.test", rol = "user") {
  const agent = request.agent(app);
  await agent
    .post("/register")
    .type("form")
    .send({
      firstName: "Estudiante",
      lastName: "Prueba",
      email,
      password: "academic-test-only",
    })
    .expect(302);
  if (rol !== "user") await UserModel.updateOne({ email }, { rol });
  const user = await UserModel.findOne({ email });
  return { agent, user, cart: String(user.cart) };
}
test("sesiones: visitante no obtiene identidad ni carrito", async () => {
  await request(app).get("/api/sessions/current").expect(401);
  await request(app).get("/api/carts/000000000000000000000001").expect(401);
});
test("sesiones: registro crea carrito y no expone hash de contraseña", async () => {
  const a = await account();
  const current = await a.agent.get("/api/sessions/current").expect(200);
  assert.equal(current.body.payload.email, "student@example.test");
  assert.equal("password" in current.body.payload, false);
  assert.ok(await CartsModel.findById(a.cart));
  await a.agent
    .get("/products")
    .expect(200)
    .expect(/Hola, Estudiante/);
});
test("sesiones: login correcto tras logout y contraseña incorrecta rechazada", async () => {
  const a = await account();
  await a.agent.post("/logout").expect(302);
  await a.agent.get("/api/sessions/current").expect(401);
  await a.agent
    .post("/login")
    .type("form")
    .send({ email: a.user.email, password: "wrong-password" })
    .expect("Location", "/login/faillogin");
  await a.agent
    .post("/login")
    .type("form")
    .send({ email: a.user.email, password: "academic-test-only" })
    .expect("Location", "/products");
  await a.agent.get("/api/sessions/current").expect(200);
});
test("sesiones: origen externo no puede mutar con cookies de sesión", async () => {
  const a = await account();
  await a.agent
    .post("/logout")
    .set("Origin", "https://foreign.example.test")
    .expect(403);
  await a.agent.get("/api/sessions/current").expect(200);
});
test("productos: catálogo público filtra categoría y ordena precios", async () => {
  await ProductsModel.create([
    sample({ price: 10 }),
    sample({ price: 5 }),
    sample({ price: 1, category: "otro" }),
  ]);
  const result = await request(app)
    .get("/api/products?query=papeler%C3%ADa&sort=asc&limit=1")
    .expect(200);
  assert.equal(result.body.payload.length, 1);
  assert.equal(result.body.payload[0].price, 5);
  assert.equal(result.body.totalPages, 2);
  assert.match(result.body.nextLink, /page=2/);
});
test("productos: límites negativos, texto, fracciones y sort inválido se rechazan", async () => {
  for (const query of [
    "limit=-1",
    "page=no",
    "limit=2.3",
    "page=0",
    "sort=wrong",
  ])
    await request(app)
      .get("/api/products?" + query)
      .expect(400);
});
test("productos: visitante y usuario común no crean productos", async () => {
  await request(app).post("/api/products").send(sample()).expect(401);
  const a = await account();
  await a.agent.post("/api/products").send(sample()).expect(403);
});
test("productos: admin crea precio/stock cero y código duplicado se rechaza", async () => {
  const a = await account("admin@example.test", "admin"),
    p = sample({ price: 0, stock: 0 });
  const created = await a.agent.post("/api/products").send(p).expect(201);
  assert.equal(created.body.payload.price, 0);
  await a.agent.post("/api/products").send(p).expect(409);
});
test("productos: premium sólo modifica sus productos; campos de propiedad no se reasignan", async () => {
  const a = await account("premium@example.test", "premium");
  const own = await ProductsModel.create(sample({ owner: a.user.email })),
    other = await ProductsModel.create(sample());
  await a.agent
    .put("/api/products/" + other._id)
    .send({ price: 7 })
    .expect(403);
  await a.agent
    .put("/api/products/" + own._id)
    .send({ price: 7, owner: "other@example.test" })
    .expect(200);
  assert.equal((await ProductsModel.findById(own._id)).owner, a.user.email);
});
test("carritos: agregar, cambiar cantidad y borrar producto", async () => {
  const a = await account(),
    p = await ProductsModel.create(sample());
  await a.agent.post("/api/carts/" + a.cart + "/products/" + p._id).expect(201);
  await a.agent
    .put("/api/carts/" + a.cart + "/products/" + p._id)
    .send({ quantity: 2 })
    .expect(200);
  assert.equal((await CartsModel.findById(a.cart)).products[0].quantity, 2);
  await a.agent
    .delete("/api/carts/" + a.cart + "/products/" + p._id)
    .expect(200);
  assert.equal((await CartsModel.findById(a.cart)).products.length, 0);
});
test("carritos: ni URL ajena ni admin permiten comprar", async () => {
  const a = await account(),
    b = await account("other@example.test");
  await a.agent.post("/api/carts/" + b.cart + "/purchase").expect(403);
  await UserModel.updateOne({ _id: a.user._id }, { rol: "admin" });
  await a.agent.post("/api/carts/" + a.cart + "/purchase").expect(403);
});
test("carritos: producto propio no se agrega ni se compra mediante reemplazo masivo", async () => {
  const a = await account("premium@example.test", "premium"),
    p = await ProductsModel.create(sample({ owner: "premium@example.test" }));
  await a.agent.post("/api/carts/" + a.cart + "/products/" + p._id).expect(403);
  await a.agent
    .put("/api/carts/" + a.cart)
    .send([{ product: String(p._id), quantity: 1 }])
    .expect(200);
  await a.agent.post("/api/carts/" + a.cart + "/purchase").expect(403);
  assert.equal(await TicketModel.countDocuments(), 0);
});
test("compra HTTP: catálogo → carrito → ticket protegido por comprador", async () => {
  const a = await account(),
    p = await ProductsModel.create(sample());
  await a.agent.get("/products").expect(200);
  await a.agent.post("/api/carts/" + a.cart + "/products/" + p._id).expect(201);
  const view = await a.agent.get("/carts/" + a.cart).expect(200);
  assert.match(view.text, /Confirmar compra/);
  const result = await a.agent
    .post("/api/carts/" + a.cart + "/purchase")
    .expect(201);
  assert.equal(result.body.ticket.amount, 1200);
  const url = "/carts/" + a.cart + "/tickets/" + result.body.ticket.code;
  const receipt = await a.agent.get(url).expect(200);
  assert.match(receipt.text, /Tu compra está lista/);
  const b = await account("other@example.test");
  await b.agent.get(url).expect(403);
  await b.agent
    .get("/carts/" + b.cart + "/tickets/" + result.body.ticket.code)
    .expect(404);
});
test("compra HTTP: sin stock no crea ticket ni elimina el carrito", async () => {
  const a = await account(),
    p = await ProductsModel.create(sample({ stock: 0 }));
  await CartsModel.updateOne(
    { _id: a.cart },
    { products: [{ product: p._id, quantity: 1 }] },
  );
  const result = await a.agent
    .post("/api/carts/" + a.cart + "/purchase")
    .expect(200);
  assert.equal(result.body.ticket, null);
  assert.equal(result.body.productsNotPurchased.length, 1);
  assert.equal((await CartsModel.findById(a.cart)).products.length, 1);
});
test("usuarios: listado administrativo no queda abierto a visitantes o clientes", async () => {
  await request(app).get("/api/users").expect(401);
  const a = await account();
  await a.agent.get("/api/users").expect(403);
});
