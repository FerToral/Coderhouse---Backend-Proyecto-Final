import { Store, missing, positiveId } from "./store.js";

export class ProductManager {
  constructor(filename) {
    this.path = filename;
    this.store = new Store(filename);
  }
  getProducts() {
    return this.store.run((state) => state.items);
  }
  getProductById(id) {
    id = positiveId(id);
    return this.store.run(
      (state) =>
        state.items.find((p) => Number(p.id) === id) ||
        (() => {
          throw missing("Product");
        })(),
    );
  }
  addProduct(product, description, price, thumbnail, code, stock) {
    // Firma posicional del primer desafío y objeto del contrato HTTP posterior.
    const input =
      typeof product === "object" && product !== null
        ? product
        : { title: product, description, price, thumbnail, code, stock };
    return this.store.run((state) => {
      const item = normalize(input);
      if (state.lastId === Number.MAX_SAFE_INTEGER)
        throw new Error("Product ID range exhausted");
      if (state.items.some((p) => p.code === item.code)) throw duplicate();
      const created = { ...item, id: ++state.lastId };
      state.items.push(created);
      return created;
    }, true);
  }
  updateProduct(id, changes) {
    id = positiveId(id);
    return this.store.run((state) => {
      const index = state.items.findIndex((p) => Number(p.id) === id);
      if (index < 0) throw missing("Product");
      if (!changes || typeof changes !== "object" || Array.isArray(changes))
        throw Object.assign(new Error("Invalid update"), { status: 400 });
      const item = normalize({ ...state.items[index], ...changes });
      if (state.items.some((p) => Number(p.id) !== id && p.code === item.code))
        throw duplicate();
      state.items[index] = { ...item, id }; // Nunca aceptar id del cuerpo.
      return state.items[index];
    }, true);
  }
  deleteProduct(id) {
    id = positiveId(id);
    return this.store.run((state) => {
      const index = state.items.findIndex((p) => Number(p.id) === id);
      if (index < 0) throw missing("Product");
      return state.items.splice(index, 1)[0];
    }, true);
  }
}
function duplicate() {
  return Object.assign(new Error("Product code already exists"), {
    status: 409,
  });
}
function normalize(input) {
  const {
    title,
    description,
    price,
    code,
    stock,
    status = true,
    category = "general",
  } = input;
  if (
    input.thumbnail !== undefined &&
    (typeof input.thumbnail !== "string" || !input.thumbnail.trim())
  )
    throw Object.assign(new Error("Thumbnail required"), { status: 400 });
  const thumbnails =
    input.thumbnails ??
    (typeof input.thumbnail === "string" ? [input.thumbnail] : null);
  if (
    [title, description, code, category].some(
      (x) => typeof x !== "string" || !x.trim(),
    ) ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isSafeInteger(stock) ||
    stock < 0 ||
    typeof status !== "boolean" ||
    !Array.isArray(thumbnails) ||
    thumbnails.some((x) => typeof x !== "string")
  )
    throw Object.assign(new Error("Invalid product fields"), { status: 400 });
  return {
    title,
    description,
    price,
    code,
    stock,
    status,
    category,
    thumbnails,
    ...(input.thumbnail !== undefined
      ? { thumbnail: thumbnails[0] || "" }
      : {}),
  };
}
