import { createServer } from "node:http";
import { Server } from "socket.io";
import path from "node:path";
import { ProductManager } from "./src/ProductManager.js";
import { CartManager } from "./src/CartManager.js";
import { createPracticeApp } from "./src/app.js";
const mode = process.argv[2] || "file";
if (!["file", "memory"].includes(mode)) throw new Error("Use file or memory");
const directory = path.resolve("practicas/01-productos-y-archivos/data");
const products = new ProductManager(
  mode === "file" ? path.join(directory, "products.json") : undefined,
);
const carts = new CartManager(
  mode === "file" ? path.join(directory, "carts.json") : undefined,
  products,
);
let io;
const app = createPracticeApp({
  products,
  carts,
  onProductsChanged: (list) => io.emit("products", list),
});
const server = createServer(app);
io = new Server(server, {
  allowRequest: (req, callback) => {
    const origin = req.headers.origin;
    callback(null, !origin || origin === "http://" + req.headers.host);
  },
});
// Sockets de lectura. Las mutaciones pasan por la API HTTP de esta práctica local.
server.listen(8081, "127.0.0.1", () =>
  console.log("Práctica " + mode + ": http://127.0.0.1:8081"),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => io.close(() => process.exit(0)));
