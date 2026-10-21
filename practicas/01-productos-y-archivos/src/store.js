import { mkdir, readFile, writeFile, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Una instancia por archivo/proceso. La cola ordena lecturas y escrituras;
// rename evita dejar JSON truncado. No sustituye transacciones multiusuario.
export class Store {
  #queue = Promise.resolve();
  #state = { lastId: 0, items: [] };
  constructor(filename) {
    this.filename = filename && path.resolve(filename);
  }
  async #load() {
    if (!this.filename) return structuredClone(this.#state);
    let parsed;
    try {
      parsed = JSON.parse(await readFile(this.filename, "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") return { lastId: 0, items: [] };
      throw error;
    }
    // Permite abrir las listas de la etapa original sin perder los IDs.
    const state = Array.isArray(parsed)
      ? {
          lastId: Math.max(0, ...parsed.map((x) => Number(x.id))),
          items: parsed,
        }
      : parsed;
    if (
      !state ||
      !Array.isArray(state.items) ||
      !Number.isSafeInteger(state.lastId) ||
      state.lastId < 0 ||
      state.items.some(
        (x) =>
          !x ||
          !Number.isSafeInteger(Number(x.id)) ||
          Number(x.id) < 1 ||
          Number(x.id) > state.lastId,
      ) ||
      new Set(state.items.map((x) => String(x.id))).size !== state.items.length
    )
      throw new Error("Invalid practice data: original file left unchanged");
    return state;
  }
  async #save(state) {
    if (!this.filename) {
      this.#state = structuredClone(state);
      return;
    }
    await mkdir(path.dirname(this.filename), { recursive: true });
    const temporary = this.filename + "." + randomUUID() + ".tmp";
    try {
      await writeFile(temporary, JSON.stringify(state, null, 2), {
        flag: "wx",
      });
      await rename(temporary, this.filename);
    } finally {
      await unlink(temporary).catch((error) => {
        if (error.code !== "ENOENT") throw error;
      });
    }
  }
  run(action, write = false) {
    const operation = this.#queue.then(async () => {
      const state = await this.#load();
      const result = await action(state);
      if (write) await this.#save(state);
      return structuredClone(result);
    });
    this.#queue = operation.catch(() => {});
    return operation;
  }
}
export function missing(kind) {
  return Object.assign(new Error(kind + " not found"), { status: 404 });
}
export function positiveId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1)
    throw Object.assign(new Error("Invalid ID"), { status: 400 });
  return id;
}
