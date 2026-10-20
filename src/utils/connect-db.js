import mongoose from "mongoose";
import env from "../config/config.js";

export async function connectMongo(uri = env.mongoUrl) {
  if (!uri) throw new Error("MONGO_URL is required");
  return mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
}
