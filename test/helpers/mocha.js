import { before, after, beforeEach } from "mocha";
import request from "supertest";
import { randomBytes } from "node:crypto";
import { startTestDatabase } from "./mongo.js";
import { UserModel } from "../../src/dao/models/users.model.js";
import { ProductsModel } from "../../src/dao/models/products.model.js";
import { CartsModel } from "../../src/dao/models/carts.model.js";
process.env.NODE_ENV = "test";
const { createApp } = await import("../../src/app.js");
export let app;
let stop;
before(async function () {
  this.timeout(180000);
  stop = await startTestDatabase();
  await Promise.all([
    UserModel.init(),
    ProductsModel.init(),
    CartsModel.init(),
  ]);
  app = createApp({ sessionSecret: randomBytes(32).toString("hex") });
});
after(async () => {
  if (stop) await stop();
});
beforeEach(async () => {
  await Promise.all([
    UserModel.deleteMany({}),
    ProductsModel.deleteMany({}),
    CartsModel.deleteMany({}),
  ]);
});
export const sample = (extra = {}) => ({
  title: "Cuaderno",
  description: "Notas de cursada",
  code: crypto.randomUUID(),
  price: 20,
  stock: 3,
  category: "papeleria",
  status: true,
  thumbnails: [],
  ...extra,
});
export async function account(role = "user") {
  const agent = request.agent(app);
  const email = crypto.randomUUID() + "@example.test";
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
  if (role !== "user") await UserModel.updateOne({ email }, { rol: role });
  const user = await UserModel.findOne({ email });
  return { agent, user, cart: String(user.cart) };
}
