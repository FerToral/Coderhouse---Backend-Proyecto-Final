// Ejercicios históricos de modelo: no abrir conexiones ni borrar colecciones al importar.
import assert from "node:assert/strict";
import { UserModel } from "../src/dao/models/users.model.js";
describe("Modelo User (validación sin persistencia)", () => {
  it("requiere email", () =>
    assert.ok(new UserModel({}).validateSync()?.errors.email));
  it("no exige datos de una base externa", () =>
    assert.equal(
      new UserModel({ email: "student@example.test" }).email,
      "student@example.test",
    ));
});
