import { expect } from "chai";
import request from "supertest";
import { app, account } from "./helpers/mocha.js";
import { UserModel } from "../src/dao/models/users.model.js";
describe("Sesiones · Mocha/Chai/Supertest", () => {
  it("registro crea carrito e identidad mínima sin contraseña", async () => {
    const { agent, user, cart } = await account();
    const res = await agent.get("/api/sessions/current").expect(200);
    expect(res.body.payload.email).to.equal(user.email);
    expect(res.body.payload).not.to.have.property("password");
    expect(cart).to.match(/^[a-f0-9]{24}$/);
    expect((await UserModel.findById(user._id)).password).not.to.equal(
      "academic-test-only",
    );
  });
  it("rechaza login incorrecto y conserva acceso sólo tras login válido", async () => {
    const { agent, user } = await account();
    await agent.post("/logout").expect(302);
    await agent
      .post("/login")
      .type("form")
      .send({ email: user.email, password: "incorrecta" })
      .expect("Location", "/login/faillogin");
    await agent.get("/api/sessions/current").expect(401);
    await agent
      .post("/login")
      .type("form")
      .send({ email: user.email, password: "academic-test-only" })
      .expect("Location", "/products");
    expect(
      (await agent.get("/api/sessions/current").expect(200)).body.payload.email,
    ).to.equal(user.email);
  });
  it("logout invalida identidad y registra última conexión", async () => {
    const { agent, user } = await account();
    await agent.post("/logout").expect(302);
    await agent.get("/api/sessions/current").expect(401);
    await request(app).get("/api/sessions/current").expect(401);
    expect(
      (await UserModel.findById(user._id)).last_connection,
    ).to.be.instanceOf(Date);
  });
});
