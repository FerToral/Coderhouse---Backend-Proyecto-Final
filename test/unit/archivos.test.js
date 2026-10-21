import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { ProductManager } from "../../practicas/01-productos-y-archivos/src/ProductManager.js";
import { CartManager } from "../../practicas/01-productos-y-archivos/src/CartManager.js";
import { createPracticeApp } from "../../practicas/01-productos-y-archivos/src/app.js";
const sample = (code = "A") => ({
  title: "Cuaderno",
  description: "Notas",
  price: 0,
  stock: 0,
  code,
  category: "papeleria",
  thumbnails: [],
});
test("memoria: empieza vacía, firma original, copia defensiva y código único", async () => {
  const manager = new ProductManager();
  assert.deepEqual(await manager.getProducts(), []);
  const p = await manager.addProduct(
    "Cuaderno",
    "Notas",
    20,
    "/img.png",
    "A",
    1,
  );
  p.title = "cambio externo";
  assert.equal((await manager.getProductById(p.id)).title, "Cuaderno");
  await assert.rejects(manager.addProduct(sample()), { status: 409 });
  await assert.rejects(manager.getProductById(99), { status: 404 });
});
test("archivos: CRUD persistente, cola concurrente, ID inmutable y no reutilizado", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "coder-files-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const filename = path.join(dir, "products.json"),
    manager = new ProductManager(filename);
  const products = await Promise.all(
    ["A", "B", "C"].map((code) => manager.addProduct(sample(code))),
  );
  assert.deepEqual(
    products.map((p) => p.id),
    [1, 2, 3],
  );
  const updated = await manager.updateProduct(2, { id: 99, price: 15 });
  assert.equal(updated.id, 2);
  const reopened = new ProductManager(filename);
  assert.equal((await reopened.getProductById(2)).price, 15);
  await reopened.deleteProduct(3);
  const next = await new ProductManager(filename).addProduct(sample("D"));
  assert.equal(next.id, 4);
  assert.equal((await new ProductManager(filename).getProducts()).length, 3);
});
test("archivos: JSON corrupto no se sobrescribe", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "coder-corrupt-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const filename = path.join(dir, "products.json");
  await writeFile(filename, "archivo incompleto", "utf8");
  await assert.rejects(new ProductManager(filename).addProduct(sample()));
  assert.equal(await readFile(filename, "utf8"), "archivo incompleto");
});
test("memoria: rechaza faltantes/negativos y conserva estado tras error", async () => {
  const manager = new ProductManager();
  for (const extra of [
    { title: "" },
    { price: -1 },
    { stock: 1.5 },
    { status: "true" },
    { thumbnails: null },
  ])
    await assert.rejects(manager.addProduct({ ...sample(), ...extra }), {
      status: 400,
    });
  assert.deepEqual(await manager.getProducts(), []);
  assert.equal((await manager.addProduct(sample())).id, 1);
});
test("carritos: persiste sólo referencias y acumula cantidad", async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "coder-cart-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const products = new ProductManager(),
    p = await products.addProduct(sample());
  const filename = path.join(dir, "carts.json"),
    carts = new CartManager(filename, products);
  const cart = await carts.createCart();
  await Promise.all([
    carts.addProductToCart(cart.id, p.id),
    carts.addProductToCart(cart.id, p.id),
  ]);
  assert.deepEqual(
    (await new CartManager(filename, products).getCartById(cart.id)).products,
    [{ product: p.id, quantity: 2 }],
  );
  await assert.rejects(carts.addProductToCart(cart.id, 99), { status: 404 });
});
test("API inicial: CRUD, limit, ID generado y eventos tras mutar", async () => {
  const products = new ProductManager(),
    carts = new CartManager(undefined, products),
    events = [];
  const app = createPracticeApp({
    products,
    carts,
    onProductsChanged: (list) => events.push(list),
  });
  const created = await request(app)
    .post("/api/products")
    .send({ ...sample(), id: 999 })
    .expect(201);
  assert.equal(created.body.id, 1);
  await request(app).post("/api/products").send(sample("B")).expect(201);
  assert.equal(
    (await request(app).get("/api/products?limit=1").expect(200)).body.length,
    1,
  );
  await request(app).get("/api/products?limit=no").expect(400);
  await request(app)
    .put("/api/products/1")
    .send({ id: 90, price: 12 })
    .expect(200);
  await request(app).delete("/api/products/1").expect(200);
  assert.deepEqual(
    events.map((items) => items.length),
    [1, 2, 2, 1],
  );
  assert.equal(
    (await request(app).get("/api/products/2").expect(200)).body.code,
    "B",
  );
});
test("API inicial: carrito, ruta no encontrada, origen ajeno y HTML escapado", async () => {
  const products = new ProductManager(),
    carts = new CartManager(undefined, products);
  const app = createPracticeApp({ products, carts });
  await products.addProduct({
    ...sample(),
    title: "<script>alert(1)</script>",
  });
  const cart = await request(app).post("/api/carts").expect(201);
  await request(app)
    .post("/api/carts/" + cart.body.id + "/product/1")
    .expect(201);
  assert.equal(
    (await request(app).get("/api/carts/1").expect(200)).body.products[0]
      .quantity,
    1,
  );
  await request(app).get("/api/products/999").expect(404);
  await request(app)
    .post("/api/products")
    .set("Origin", "https://foreign.example.test")
    .send(sample())
    .expect(403);
  const html = await request(app).get("/realtimeproducts").expect(200);
  assert.match(html.text, /&lt;script&gt;/);
  assert.doesNotMatch(html.text, /<script>alert/);
});
