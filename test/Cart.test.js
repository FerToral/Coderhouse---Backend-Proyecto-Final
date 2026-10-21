import { expect } from "chai";
import { account, sample } from "./helpers/mocha.js";
import { ProductsModel } from "../src/dao/models/products.model.js";
import { CartsModel } from "../src/dao/models/carts.model.js";
describe("Carritos · Mocha/Chai/Supertest", () => {
  it("acumula cantidad y devuelve producto poblado", async () => {
    const { agent, cart } = await account(),
      product = await ProductsModel.create(sample());
    for (let i = 0; i < 2; i++)
      await agent
        .post("/api/carts/" + cart + "/products/" + product._id)
        .expect(201);
    const response = await agent.get("/api/carts/" + cart).expect(200);
    expect(response.body.data.products[0].quantity).to.equal(2);
    expect(response.body.data.products[0].product.title).to.equal(
      product.title,
    );
  });
  it("reemplaza cantidades y vacía el carrito", async () => {
    const { agent, cart } = await account(),
      product = await ProductsModel.create(sample());
    await agent
      .post("/api/carts/" + cart + "/products/" + product._id)
      .expect(201);
    await agent
      .put("/api/carts/" + cart + "/products/" + product._id)
      .send({ quantity: 3 })
      .expect(200);
    expect((await CartsModel.findById(cart)).products[0].quantity).to.equal(3);
    await agent.delete("/api/carts/" + cart).expect(200);
    expect((await CartsModel.findById(cart)).products).to.have.length(0);
  });
  it("no deja leer ni modificar un carrito ajeno", async () => {
    const owner = await account(),
      other = await account(),
      product = await ProductsModel.create(sample());
    await other.agent.get("/api/carts/" + owner.cart).expect(403);
    await other.agent
      .post("/api/carts/" + owner.cart + "/products/" + product._id)
      .expect(403);
    expect((await CartsModel.findById(owner.cart)).products).to.have.length(0);
  });
});
