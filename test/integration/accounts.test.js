import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { randomBytes } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { startTestDatabase } from "../helpers/mongo.js";
import { UserModel } from "../../src/dao/models/users.model.js";
import { CartsModel } from "../../src/dao/models/carts.model.js";
import { ProductsModel } from "../../src/dao/models/products.model.js";
import { RecoverTokensModel } from "../../src/dao/models/recover-tokens.model.js";
import { recoveryService } from "../../src/services/recovery.services.js";
import { isValidPassword } from "../../src/utils/bcrypt.js";
process.env.NODE_ENV = "test";
const { createApp } = await import("../../src/app.js");
let stop,
  app,
  uploadRoot,
  outbox = [];
before(
  async () => {
    stop = await startTestDatabase();
    await Promise.all([
      UserModel.init(),
      CartsModel.init(),
      ProductsModel.init(),
      RecoverTokensModel.init(),
    ]);
    uploadRoot = await mkdtemp(path.join(os.tmpdir(), "citycode-tests-"));
    app = createApp({
      sessionSecret: randomBytes(32).toString("hex"),
      uploadRoot,
      mailer: async (message) => outbox.push(message),
    });
  },
  { timeout: 180000 },
);
after(async () => {
  if (stop) await stop();
  if (uploadRoot) await rm(uploadRoot, { recursive: true, force: true });
});
beforeEach(async () => {
  outbox = [];
  await Promise.all([
    UserModel.deleteMany({}),
    CartsModel.deleteMany({}),
    ProductsModel.deleteMany({}),
    RecoverTokensModel.deleteMany({}),
  ]);
});
async function account(email = "student@example.test", rol = "user") {
  const agent = request.agent(app);
  await agent
    .post("/register")
    .type("form")
    .send({ firstName: "Estudiante", email, password: "academic-test-only" })
    .expect(302);
  if (rol !== "user") await UserModel.updateOne({ email }, { rol });
  return { agent, user: await UserModel.findOne({ email }) };
}
const document = Buffer.from("%PDF-1.7\n academic test only");
test("documentos: un usuario no puede cargar documentos en cuenta ajena", async () => {
  const a = await account(),
    b = await account("b@example.test");
  await a.agent
    .post("/api/users/" + b.user._id + "/documents")
    .attach("identificacion", document, "id.pdf")
    .expect(403);
});
test("documentos: los tres comprobantes habilitan premium y la descarga es privada", async () => {
  const a = await account(),
    admin = await account("admin@example.test", "admin");
  await a.agent
    .post("/api/users/" + a.user._id + "/documents")
    .attach("identificacion", document, "id.pdf")
    .attach("comprobante_domicilio", document, "address.pdf")
    .attach("comprobante_estado_cuenta", document, "account.pdf")
    .expect(201);
  await admin.agent.patch("/api/users/premium/" + a.user._id).expect(200);
  assert.equal((await UserModel.findById(a.user._id)).rol, "premium");
  const url = "/api/users/" + a.user._id + "/documents/identificacion";
  await a.agent.get(url).expect(200);
  await request(app).get(url).expect(401);
});
test("documentos: no permite extensión/MIME falso ni campo desconocido", async () => {
  const a = await account(),
    url = "/api/users/" + a.user._id + "/documents";
  await a.agent
    .post(url)
    .attach("identificacion", Buffer.from("<script>bad</script>"), "fake.pdf")
    .expect(400);
  await a.agent.post(url).attach("other", document, "id.pdf").expect(400);
  assert.equal((await UserModel.findById(a.user._id)).documents.length, 0);
});
test("roles: faltan comprobantes, usuario no se autopromueve y premium puede volver a user", async () => {
  const a = await account(),
    admin = await account("admin@example.test", "admin"),
    url = "/api/users/premium/" + a.user._id;
  await a.agent.patch(url).expect(403);
  await admin.agent.patch(url).expect(409);
  await UserModel.updateOne({ _id: a.user._id }, { rol: "premium" });
  await admin.agent.patch(url).expect(200);
  assert.equal((await UserModel.findById(a.user._id)).rol, "user");
  await admin.agent
    .put("/api/users/" + a.user._id + "/role")
    .send({ rol: "admin" })
    .expect(400);
});
test("administración: vista protegida y listado sin password/documentos sensibles", async () => {
  const a = await account(),
    admin = await account("admin@example.test", "admin");
  await a.agent.get("/users").expect(403);
  await admin.agent.get("/users").expect(200);
  const result = await admin.agent.get("/api/users").expect(200);
  assert.equal(JSON.stringify(result.body).includes("password"), false);
  assert.equal(JSON.stringify(result.body).includes("documents"), false);
});
test("inactividad: elimina sólo usuarios de más de dos días y simula el correo", async () => {
  const old = await account(),
    fresh = await account("fresh@example.test"),
    admin = await account("admin@example.test", "admin");
  await UserModel.updateOne(
    { _id: old.user._id },
    { last_connection: new Date(Date.now() - 3 * 86400000) },
  );
  const result = await admin.agent.delete("/api/users").expect(200);
  assert.equal(result.body.deleted, 1);
  assert.equal(outbox.length, 1);
  assert.equal(outbox[0].to, old.user.email);
  assert.ok(await UserModel.findById(fresh.user._id));
  assert.ok(await UserModel.findById(admin.user._id));
});
test("inactividad: un fallo de correo conserva la cuenta", async () => {
  const old = await account(),
    admin = await account("admin@example.test", "admin");
  await UserModel.updateOne(
    { _id: old.user._id },
    { last_connection: new Date(Date.now() - 3 * 86400000) },
  );
  app.locals.sendNotification = async () => {
    throw new Error("simulated mail error");
  };
  try {
    await admin.agent.delete("/api/users").expect(500);
    assert.ok(await UserModel.findById(old.user._id));
  } finally {
    app.locals.sendNotification = async (message) => outbox.push(message);
  }
});
test("administración: borrar usuario no permite borrar el administrador conectado", async () => {
  const a = await account(),
    admin = await account("admin@example.test", "admin");
  await admin.agent.delete("/api/users/" + admin.user._id).expect(409);
  await admin.agent.delete("/api/users/" + a.user._id).expect(200);
  assert.equal(await UserModel.findById(a.user._id), null);
});
test("producto premium: borrado administrativo notifica al dueño", async () => {
  const a = await account("premium@example.test", "premium"),
    admin = await account("admin@example.test", "admin");
  const p = await ProductsModel.create({
    title: "Papel",
    description: "Prueba",
    code: "MAIL",
    price: 2,
    stock: 1,
    status: true,
    category: "test",
    thumbnails: [],
    owner: a.user.email,
  });
  await admin.agent.delete("/api/products/" + p._id).expect(200);
  assert.equal(outbox.length, 1);
  assert.equal(outbox[0].to, a.user.email);
  assert.equal(await ProductsModel.findById(p._id), null);
});
async function resetLink(a) {
  await a.agent
    .post("/recovery")
    .type("form")
    .send({ email: a.user.email })
    .expect(200);
  return new URL(outbox.at(-1).text.match(/http[^\s]+/)[0]);
}
test("recuperación: token guardado como hash, un uso y contraseña diferente", async () => {
  const a = await account(),
    url = await resetLink(a),
    token = url.searchParams.get("token");
  const stored = await RecoverTokensModel.findOne({ email: a.user.email });
  assert.notEqual(stored.token, token);
  await a.agent.get(url.pathname + url.search).expect(200);
  await a.agent
    .post("/recovery/pass")
    .type("form")
    .send({ email: a.user.email, token, password: "academic-test-only" })
    .expect(409);
  await a.agent
    .post("/recovery/pass")
    .type("form")
    .send({ email: a.user.email, token, password: "a-new-academic-password" })
    .expect(200);
  assert.ok(
    isValidPassword(
      "a-new-academic-password",
      (await UserModel.findById(a.user._id)).password,
    ),
  );
  await a.agent
    .post("/recovery/pass")
    .type("form")
    .send({ email: a.user.email, token, password: "another-password" })
    .expect(410);
});
test("recuperación: enlace vencido devuelve formulario de reenvío sin modificar cuenta", async () => {
  const a = await account(),
    url = await resetLink(a),
    before = a.user.password;
  await RecoverTokensModel.updateMany(
    {},
    { expire: new Date(Date.now() - 1000) },
  );
  const response = await a.agent.get(url.pathname + url.search).expect(410);
  assert.match(response.text, /pedir uno nuevo/);
  assert.equal((await UserModel.findById(a.user._id)).password, before);
});
test("recuperación: no expone si el correo desconocido existe", async () => {
  const result = await request(app)
    .post("/recovery")
    .type("form")
    .send({ email: "unknown@example.test" })
    .expect(200);
  assert.match(result.text, /Si la cuenta existe/);
  assert.equal(outbox.length, 0);
});
