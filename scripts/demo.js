// Demo efímera: no usa .env ni URI externa; todos los datos se pierden al cerrar.
process.env.NODE_ENV = "test";
const { randomBytes } = await import("node:crypto");
const { createServer } = await import("node:http");
const { startTestDatabase } = await import("../test/helpers/mongo.js");
const { ProductsModel } = await import("../src/dao/models/products.model.js");
const { createApp } = await import("../src/app.js");
const { connectSocket } = await import("../src/utils/connect-socket.js");
const stop = await startTestDatabase();
await ProductsModel.create([
  {
    title: "Cuaderno de ideas",
    description:
      "Hojas lisas, encuadernación flexible y espacio para lo que viene.",
    code: "DEMO-01",
    category: "Escritorio",
    price: 6800,
    stock: 8,
    thumbnails: [],
    status: true,
  },
  {
    title: "Lámpara de lectura",
    description: "Luz cálida para una pausa, un libro o tu próximo proyecto.",
    code: "DEMO-02",
    category: "Iluminación",
    price: 24500,
    stock: 4,
    thumbnails: [],
    status: true,
  },
  {
    title: "Organizador de mesa",
    description: "Un lugar para cada herramienta. Madera y líneas simples.",
    code: "DEMO-03",
    category: "Escritorio",
    price: 12400,
    stock: 6,
    thumbnails: [],
    status: true,
  },
  {
    title: "Taza de cerámica",
    description: "Una pieza cotidiana para acompañar tus mañanas.",
    code: "DEMO-04",
    category: "Cotidiano",
    price: 8900,
    stock: 0,
    thumbnails: [],
    status: true,
  },
]);
const app = createApp({ sessionSecret: randomBytes(32).toString("hex") });
const server = createServer(app);
const chatIO = connectSocket(server, app.locals.sessionMiddleware);
app.locals.chatIO = chatIO;
server.listen(8767, "127.0.0.1", () =>
  console.log("Demo local efímera: http://127.0.0.1:8767/products"),
);
const shutdown = () =>
  chatIO.close(async () => {
    await stop();
    process.exit(0);
  });
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
