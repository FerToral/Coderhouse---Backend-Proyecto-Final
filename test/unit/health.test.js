import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { randomBytes } from "node:crypto";
process.env.NODE_ENV = "test";
const { createApp } = await import("../../src/app.js");
test("healthz informa disponibilidad sin sesión ni detalles privados", async () => {
  for (const [probe, expected] of [
    [() => true, 200],
    [() => false, 503],
    [
      () => {
        throw new Error("private configuration");
      },
      503,
    ],
  ]) {
    const app = createApp({
      sessionSecret: randomBytes(32).toString("hex"),
      healthCheck: probe,
    });
    const result = await request(app).get("/healthz").expect(expected);
    assert.deepEqual(result.body, {
      status: expected === 200 ? "ok" : "unavailable",
    });
    assert.equal(result.headers["set-cookie"], undefined);
  }
});
