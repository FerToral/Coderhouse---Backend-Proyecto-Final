import { productDao } from "../dao/factory.js";

// Contrato de persistencia de productos: ni controladores ni servicios dependen
// de consultas Mongoose. El DAO conserva las operaciones atómicas de Mongo.
export class ProductRepository {
  constructor(dao = productDao) {
    this.dao = dao;
  }
  getAll() {
    return this.dao.getAll();
  }
  getById(id) {
    return this.dao.getById(id);
  }
  findByCode(code) {
    return this.dao.findByCode(code);
  }
  create(product) {
    return this.dao.create(product);
  }
  updateById(id, changes) {
    return this.dao.updateById(id, changes);
  }
  deleteById(id) {
    return this.dao.deleteById(id);
  }
  paginate(filter, options) {
    return this.dao.paginate(filter, options);
  }
  async reserveStock(id, quantity, session) {
    const result = await this.dao.reserveStock(id, quantity, session);
    if (result.modifiedCount !== 1)
      throw Object.assign(new Error("Stock changed; retry purchase"), {
        status: 409,
      });
  }
}
export const productRepository = new ProductRepository();
