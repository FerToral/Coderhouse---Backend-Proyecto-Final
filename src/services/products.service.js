import { productRepository } from "../repositories/products.repository.js";

export class ProductService {
  constructor(repository = productRepository) {
    this.repository = repository;
  }

  async paginationProduct(limit, page, query, sort) {
    const products = await this.repository.paginate(query, {
      limit,
      page,
      sort: sort ? { price: sort === "asc" ? 1 : -1 } : { _id: 1 },
    });
    if (page > Math.max(1, products.totalPages))
      throw Object.assign(new Error("No existe esa página del catálogo."), {
        status: 404,
      });
    const criterion =
      query.category ||
      (query.status === undefined ? "" : String(query.status));
    const link = (target) =>
      "?" +
      new URLSearchParams({
        limit: String(limit),
        page: String(target),
        query: criterion,
        sort,
      });
    products.prevLink = products.hasPrevPage ? link(products.prevPage) : null;
    products.nextLink = products.hasNextPage ? link(products.nextPage) : null;
    return products;
  }
  getProducts() {
    return this.repository.getAll();
  }
  async getProductById(id) {
    const product = await this.repository.getById(id);
    if (!product)
      throw Object.assign(new Error("Product not found"), { status: 404 });
    return product;
  }
  async updateProduct(id, changes) {
    const product = await this.repository.updateById(id, changes);
    if (!product)
      throw Object.assign(new Error("Product not found"), { status: 404 });
    return product;
  }
  reserveStock(id, quantity, session) {
    return this.repository.reserveStock(id, quantity, session);
  }
  deleteProduct(id) {
    return this.repository.deleteById(id);
  }
  // Conservar códigos nativos (p.ej.11000) para traducir duplicados a409.
  addProduct(product) {
    return this.repository.create(product);
  }
}
