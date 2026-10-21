import { ProductsModel } from "../models/products.model.js";
export class ProductDao {
  async getAll() {
    return await ProductsModel.find({});
  }

  async getById(id) {
    const search = await ProductsModel.findById(id);
    return search;
  }

  async create(newProduct) {
    return await ProductsModel.create(newProduct);
  }

  async updateById(id, updateData) {
    return ProductsModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async deleteById(id) {
    await ProductsModel.deleteOne({ _id: id });
  }

  async findByCode(code) {
    return ProductsModel.findOne({ code });
  }
  paginate(filter, options) {
    return ProductsModel.paginate(filter, options);
  }
  reserveStock(id, quantity, session) {
    return ProductsModel.updateOne(
      { _id: id, stock: { $gte: quantity }, status: { $ne: false } },
      { $inc: { stock: -quantity } },
      { session },
    );
  }
}

const productDao = new ProductDao();

export default productDao;
