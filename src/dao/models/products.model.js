import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const productsSchema = mongoose.Schema({
  title: { type: String, required: true, max: 100 },
  description: { type: String, required: true, max: 100 },
  price: { type: Number, required: true, min: 0 },
  stock: {
    type: Number,
    required: true,
    min: 0,
    validate: Number.isSafeInteger,
  },
  thumbnails: { type: Array, required: true, max: 100 },
  status: { type: Boolean, required: true },
  code: { type: String, required: true, max: 100, unique: true },
  category: { type: String, required: true, max: 100 },
  owner: { type: String, default: "admin" },
});

productsSchema.plugin(mongoosePaginate);
export const ProductsModel = mongoose.model("products", productsSchema);
