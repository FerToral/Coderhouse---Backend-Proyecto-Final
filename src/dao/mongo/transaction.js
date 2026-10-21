import mongoose from "mongoose";
export async function runMongoTransaction(work) {
  let result;
  await mongoose.connection.transaction(async (session) => {
    // El callback puede repetirse ante un conflicto transitorio.
    result = await work(session);
  });
  return result;
}
