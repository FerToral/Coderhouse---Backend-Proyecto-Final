import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { apiDocumentation as spec } from "../../src/docs/openapi.js";
process.env.NODE_ENV = "test";
const { createApp } = await import("../../src/app.js");
test("OpenAPI: documento servido y rutas coinciden con productos/carritos", async () => {
  const app = createApp({ sessionSecret: "x".repeat(64) });
  const response = await request(app).get("/apidocs.json").expect(200);
  assert.equal(response.body.openapi, "3.0.3");
  const expected = {
    "/api/products": ["get", "post"],
    "/api/products/{pid}": ["get", "put", "delete"],
    "/api/carts": ["post"],
    "/api/carts/{cid}": ["get", "put", "delete"],
    "/api/carts/{cid}/products/{pid}": ["post", "put", "delete"],
    "/api/carts/{cid}/purchase": ["post", "put"],
    "/api/sessions/current": ["get"],
  };
  for (const [route, methods] of Object.entries(expected)) {
    assert.deepEqual(
      Object.keys(spec.paths[route]).filter((k) => k !== "parameters"),
      methods,
    );
    for (const method of methods)
      if (!(route.startsWith("/api/products") && method === "get"))
        assert.deepEqual(spec.paths[route][method].security, [
          { sessionCookie: [] },
        ]);
  }
  assert.equal(
    spec.components.securitySchemes.sessionCookie.name,
    "connect.sid",
  );
  assert.ok(spec.paths["/api/carts/{cid}/purchase"].post.responses["201"]);
  assert.equal(
    spec.paths["/api/carts/{cid}"].put.requestBody.content["application/json"]
      .schema.type,
    "array",
  );
});
test("OpenAPI: referencias locales resueltas y sin propietario sensible en DTO", () => {
  function inspect(value) {
    if (!value || typeof value !== "object") return;
    if (value.$ref) {
      const keys = value.$ref.split("/").slice(1);
      let resolved = spec;
      for (const key of keys) resolved = resolved?.[key];
      assert.ok(resolved, value.$ref);
    }
    for (const entry of Object.values(value)) inspect(entry);
  }
  inspect(spec);
  assert.equal(spec.components.schemas.Product.properties.owner, undefined);
  assert.equal(
    spec.paths["/api/products"].get.parameters[0].schema.maximum,
    100,
  );
});
