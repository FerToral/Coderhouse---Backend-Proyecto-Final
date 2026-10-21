import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
export async function startTestDatabase() {
  // URI generada aquí: nunca se consume MONGO_URL ni una base del usuario.
  const repl = await MongoMemoryReplSet.create({
    binary: { version: "7.0.14" },
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  await mongoose.connect(repl.getUri(), { dbName: "ecommerce_test" });
  return async () => {
    await mongoose.disconnect();
    await repl.stop();
  };
}
