import { productRepository } from "../repositories/products.repository.js";
export function parsePagination(query) {
  const limit = query.limit === undefined ? 10 : Number(query.limit);
  const page = query.page === undefined ? 1 : Number(query.page);
  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 100000
  ) {
    throw Object.assign(
      new Error("Invalid pagination: limit 1–100, page 1–100000"),
      { status: 400 },
    );
  }
  if (query.sort && !["asc", "desc"].includes(query.sort))
    throw Object.assign(new Error("Invalid price sort"), { status: 400 });
  if (query.query !== undefined && typeof query.query !== "string")
    throw Object.assign(new Error("Invalid category"), { status: 400 });
  const filter = query.query
    ? ["true", "false"].includes(query.query)
      ? { status: query.query === "true" }
      : { category: query.query }
    : {};
  return { limit, page, query: filter, sort: query.sort || "" };
}
export function paginationMiddleware(req, res, next) {
  try {
    req.paginationOptions = parsePagination(req.query);
    next();
  } catch (err) {
    next(err);
  }
}
export async function validationProduct(req, res, next) {
  try {
    const {
      title,
      description,
      code,
      price,
      stock,
      category,
      thumbnails = [],
      status = true,
    } = req.body;
    if (
      [title, description, code, category].some(
        (value) => typeof value !== "string" || !value.trim(),
      ) ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isSafeInteger(stock) ||
      stock < 0 ||
      !Array.isArray(thumbnails) ||
      thumbnails.some((value) => typeof value !== "string") ||
      typeof status !== "boolean"
    ) {
      return res
        .status(400)
        .json({ status: "error", msg: "Invalid product fields" });
    }
    if (await productRepository.findByCode(code))
      return res
        .status(409)
        .json({ status: "error", msg: "Product code already exists" });
    req.product = {
      title,
      description,
      code,
      price,
      stock,
      category,
      thumbnails,
      status,
      owner:
        req.session.user.rol === "premium" ? req.session.user.email : "admin",
    };
    next();
  } catch (err) {
    next(err);
  }
}
export function mayCreateProduct(req, res, next) {
  if (!req.session?.user)
    return res.status(401).json({ status: "error", msg: "Login required" });
  if (["admin", "premium"].includes(req.session.user.rol)) return next();
  return res
    .status(403)
    .json({ status: "error", msg: "Product management forbidden" });
}
export async function mayModifyProduct(req, res, next) {
  try {
    const user = req.session?.user;
    if (!user)
      return res.status(401).json({ status: "error", msg: "Login required" });
    const product = await productRepository.getById(req.params.pid);
    if (!product)
      return res
        .status(404)
        .json({ status: "error", msg: "Product not found" });
    if (
      user.rol !== "admin" &&
      !(user.rol === "premium" && product.owner === user.email)
    ) {
      return res
        .status(403)
        .json({ status: "error", msg: "Product management forbidden" });
    }
    req.existingProduct = product;
    next();
  } catch (err) {
    next(err);
  }
}
