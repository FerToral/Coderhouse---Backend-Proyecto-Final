import { randomBytes } from "node:crypto";
export function generateMockProducts(count = 100) {
  if (!Number.isSafeInteger(count) || count < 1 || count > 1000)
    throw Object.assign(new Error("Invalid mock count"), { status: 400 });
  return Array.from({ length: count }, (_, index) => ({
    _id: randomBytes(12).toString("hex"),
    title: "Producto " + (index + 1),
    description: "Ejemplo de catálogo sin persistencia",
    price: Math.round(Math.random() * 10000) / 100,
    stock: Math.floor(Math.random() * 100),
    thumbnails: [],
    status: true,
    code: "MOCK-" + randomBytes(12).toString("hex"),
    category: "prueba",
    owner: "admin",
  }));
}
