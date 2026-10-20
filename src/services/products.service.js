//@ts-check

import { ProductsModel } from "../dao/models/products.model.js";
import { productDao } from "../dao/factory.js";

export class ProductService {
  #products = [];
  constructor() {}

  async paginationProduct(limit, page, query, sort) {
    const options = {
      limit: limit,
      page: page,
      sort: sort ? { price: sort === "asc" ? 1 : -1 } : { _id: 1 },
    };

    const products = await ProductsModel.paginate(query, options);
    const setLinks = () => {
      let prevLink = "";
      let nextLink = "";

      const criterion =
        query.category ||
        (query.status === undefined ? "" : String(query.status));
      const link = (page) =>
        "?" +
        new URLSearchParams({
          limit: String(limit),
          page: String(page),
          query: criterion,
          sort,
        });
      products.hasNextPage
        ? (nextLink = link(products.nextPage))
        : (nextLink = null);
      products.hasPrevPage
        ? (prevLink = link(products.prevPage))
        : (prevLink = null);
      products.prevLink = prevLink;
      products.nextLink = nextLink;
      return products;
    };
    setLinks();

    return products;
  }

  async getProducts() {
    this.#products = await productDao.getAll();
    return this.#products;
  }

  async getProductById(id) {
    try {
      const search = await productDao.getById(id);
      if (!search)
        throw Object.assign(new Error("Product not found"), { status: 404 });
      return search;
    } catch (error) {
      throw error;
    }
  }
  async updateProduct(id, updateData) {
    await productDao.updateById(id, updateData);
  }
  async reserveStock(id, quantity, session) {
    const result = await ProductsModel.updateOne(
      { _id: id, stock: { $gte: quantity }, status: { $ne: false } },
      { $inc: { stock: -quantity } },
      { session },
    );
    if (result.modifiedCount !== 1)
      throw Object.assign(new Error("Stock changed; retry purchase"), {
        status: 409,
      });
  }
  async deleteProduct(id) {
    await productDao.deleteById(id);
  }
  async #validationProduct(newProduct) {
    const search = await productDao.updateById(newProduct.code);
    const codeRepeate = search.length > 0 ? true : false;
    const allValuesExist = Object.entries(newProduct).every(
      ([key, value]) => key === "thumbnails" || (!!value && value !== ""),
    );

    if (codeRepeate) {
      console.log();
      throw new Error("Error. Repeated Product Code");
    }
    if (!allValuesExist) {
      throw new Error("Error. Entering empty, null or undefined fields");
    }
  }
  async addProduct(newProduct) {
    try {
      return await productDao.create(newProduct);
    } catch (error) {
      throw new Error(`${error.message}. Error adding product to MongoDB`);
    }
  }
}
