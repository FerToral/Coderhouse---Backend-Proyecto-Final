// Operación administrativa explícita: nunca se ejecuta al iniciar la tienda.
import mongoose from "mongoose";
import env, { validateEnvironment } from "../src/config/config.js";
import { UserModel } from "../src/dao/models/users.model.js";
try {
  validateEnvironment();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("ADMIN_EMAIL required");
  await mongoose.connect(env.mongoUrl);
  const user = await UserModel.findOneAndUpdate(
    { email },
    { $set: { rol: "admin" } },
    { new: true },
  );
  if (!user) throw new Error("Register account first");
  console.log("Cuenta existente promovida a administración.");
} catch {
  console.error(
    "No se pudo promover la cuenta. Revisar configuración y registrar primero la cuenta elegida.",
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
