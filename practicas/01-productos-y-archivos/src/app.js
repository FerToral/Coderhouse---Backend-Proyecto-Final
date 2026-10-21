import express from "express";
import handlebars from "express-handlebars";
import path from "node:path";
import { fileURLToPath } from "node:url";
import errorResponse from "../../../src/middlewares/errors/index.js";

const root = path.dirname(fileURLToPath(import.meta.url));
export function createPracticeApp({
  products,
  carts,
  onProductsChanged = () => {},
}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));
  app.use((req, res, next) => {
    if (
      req.get("Origin") &&
      req.get("Origin") !== req.protocol + "://" + req.get("host")
    )
      return res.status(403).json({ status: "error", msg: "Invalid origin" });
    next();
  });
  app.engine("handlebars", handlebars.engine({ defaultLayout: false }));
  app.set("view engine", "handlebars");
  app.set("views", path.join(root, "../views"));
  app.use("/recursos", express.static(path.join(root, "../public")));
  const route = (handler) => async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (error) {
      next(error);
    }
  };
  app.get(
    ["/", "/realtimeproducts"],
    route(async (req, res) =>
      res.render("products", {
        products: await products.getProducts(),
        realtime: req.path === "/realtimeproducts",
      }),
    ),
  );
  app.get(
    "/api/products",
    route(async (req, res) => {
      const all = await products.getProducts();
      if (req.query.limit === undefined) return res.json(all);
      const limit = Number(req.query.limit);
      if (!Number.isSafeInteger(limit) || limit < 1)
        throw Object.assign(new Error("Invalid limit"), { status: 400 });
      res.json(all.slice(0, limit));
    }),
  );
  app.get(
    "/api/products/:pid",
    route(async (req, res) =>
      res.json(await products.getProductById(req.params.pid)),
    ),
  );
  app.post(
    "/api/products",
    route(async (req, res) => {
      if (typeof req.body.category !== "string")
        throw Object.assign(new Error("Category required"), { status: 400 });
      const product = await products.addProduct({
        ...req.body,
        thumbnails: req.body.thumbnails ?? [],
      });
      onProductsChanged(await products.getProducts());
      res.status(201).json(product);
    }),
  );
  app.put(
    "/api/products/:pid",
    route(async (req, res) => {
      const product = await products.updateProduct(req.params.pid, req.body);
      onProductsChanged(await products.getProducts());
      res.json(product);
    }),
  );
  app.delete(
    "/api/products/:pid",
    route(async (req, res) => {
      await products.deleteProduct(req.params.pid);
      onProductsChanged(await products.getProducts());
      res.json({ status: "success" });
    }),
  );
  app.post(
    "/api/carts",
    route(async (req, res) => res.status(201).json(await carts.createCart())),
  );
  app.get(
    "/api/carts/:cid",
    route(async (req, res) =>
      res.json(await carts.getCartById(req.params.cid)),
    ),
  );
  app.post(
    "/api/carts/:cid/product/:pid",
    route(async (req, res) =>
      res
        .status(201)
        .json(await carts.addProductToCart(req.params.cid, req.params.pid)),
    ),
  );
  app.use((req, res, next) =>
    next(Object.assign(new Error("Route not found"), { status: 404 })),
  );
  app.use(errorResponse);
  return app;
}
