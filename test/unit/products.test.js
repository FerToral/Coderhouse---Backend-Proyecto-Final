import { test } from "node:test";
import assert from "node:assert/strict";
import { ProductService } from "../../src/services/products.service.js";
import { ProductRepository } from "../../src/repositories/products.repository.js";
import { generateMockProducts } from "../../src/utils/mocking.js";
import { describeError } from "../../src/services/errors/catalog.js";
import { ProductsModel } from "../../src/dao/models/products.model.js";
test("mocking: 100 documentos válidos sin IDs ni códigos repetidos", () => {
  const products = generateMockProducts();
  assert.equal(products.length, 100);
  assert.equal(new Set(products.map((p) => p._id)).size, 100);
  assert.equal(new Set(products.map((p) => p.code)).size, 100);
  for (const p of products) {
    assert.match(p._id, /^[a-f0-9]{24}$/);
    assert.equal(new ProductsModel(p).validateSync(), undefined);
  }
});
test("Repository conserva la sesión y detecta conflicto al reservar stock", async () => {
  const session = {},
    calls = [];
  const repo = new ProductRepository({
    reserveStock: async (...args) => {
      calls.push(args);
      return { modifiedCount: 0 };
    },
  });
  await assert.rejects(repo.reserveStock("p", 2, session), { status: 409 });
  assert.deepEqual(calls, [["p", 2, session]]);
});
test("servicio usa Repository sin depender de consultas Mongo", async () => {
  const record = { _id: "p", price: 2 };
  const service = new ProductService({
    getById: async () => record,
    create: async () => {
      throw Object.assign(new Error("duplicate"), { code: 11000 });
    },
    paginate: async () => ({
      docs: [record],
      hasNextPage: true,
      nextPage: 2,
      hasPrevPage: false,
    }),
  });
  assert.equal(await service.getProductById("p"), record);
  await assert.rejects(service.addProduct(record), { code: 11000 });
  const result = await service.paginationProduct(
    10,
    1,
    { status: false },
    "desc",
  );
  assert.match(result.nextLink, /query=false/);
  assert.equal(result.prevLink, null);
});
test("catálogo de errores traduce duplicados, validación y oculta errores internos", () => {
  assert.equal(describeError({ code: 11000 }).status, 409);
  assert.equal(describeError({ name: "CastError" }).code, "INVALID_INPUT");
  assert.equal(
    describeError(new Error("private configuration")).message,
    "Internal server error",
  );
});
