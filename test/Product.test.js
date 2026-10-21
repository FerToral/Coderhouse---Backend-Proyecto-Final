import { expect } from "chai";
import request from "supertest";
import { app, account, sample } from "./helpers/mocha.js";
import { ProductsModel } from "../src/dao/models/products.model.js";

describe("Productos · Mocha/Chai/Supertest", () => {
  it("filtra, ordena y pagina con enlaces del contrato", async () => {
    await ProductsModel.create([
      sample({ price: 30 }),
      sample({ price: 10 }),
      sample({ category: "otro" }),
    ]);
    const res = await request(app)
      .get("/api/products?query=papeleria&sort=asc&limit=1")
      .expect(200);
    expect(res.body.payload).to.have.length(1);
    expect(res.body.payload[0].price).to.equal(10);
    expect(res.body.totalPages).to.equal(2);
    expect(res.body.nextLink).to.include("page=2");
  });
  it("crea con admin e ID generado; rechaza códigos duplicados", async () => {
    const { agent } = await account("admin");
    const product = sample({ stock: 0, price: 0 });
    const res = await agent.post("/api/products").send(product).expect(201);
    expect(res.body.payload._id).to.match(/^[a-f0-9]{24}$/);
    expect(res.body.payload.stock).to.equal(0);
    await agent.post("/api/products").send(product).expect(409);
    expect(await ProductsModel.countDocuments()).to.equal(1);
  });
  it("actualiza y borra sin permitir a un usuario común escribir", async () => {
    const admin = await account("admin"),
      client = await account();
    const product = await ProductsModel.create(sample());
    await client.agent
      .put("/api/products/" + product._id)
      .send({ price: 9 })
      .expect(403);
    const updated = await admin.agent
      .put("/api/products/" + product._id)
      .send({ price: 9 })
      .expect(200);
    expect(updated.body.payload.price).to.equal(9);
    await admin.agent.delete("/api/products/" + product._id).expect(200);
    expect(await ProductsModel.findById(product._id)).to.equal(null);
  });
});
