import { randomBytes, createHash as digest } from "node:crypto";
import { UserModel } from "../dao/models/users.model.js";
import { RecoverTokensModel } from "../dao/models/recover-tokens.model.js";
import { createHash, isValidPassword } from "../utils/bcrypt.js";
import { runMongoTransaction } from "../dao/mongo/transaction.js";
import env from "../config/config.js";
const hash = (token) => digest("sha256").update(String(token)).digest("hex");
const failure = () =>
  Object.assign(new Error("Invalid or expired link"), { status: 410 });
export class RecoveryService {
  async sendEmail(email, send) {
    if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email))
      throw Object.assign(new Error("Valid email required"), { status: 400 });
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) return; // Respuesta neutra para evitar enumeración de cuentas.
    const token = randomBytes(32).toString("hex");
    await RecoverTokensModel.create({
      email: user.email,
      token: hash(token),
      expire: new Date(Date.now() + 3600000),
    });
    const url =
      env.apiUrl +
      "/recovery/pass?" +
      new URLSearchParams({ token, email: user.email });
    await send({
      to: user.email,
      subject: "Restablecer contraseña CityCode",
      text: "Este enlace vence en una hora: " + url,
    });
  }
  async findToken(token, email) {
    if (typeof token !== "string" || typeof email !== "string") throw failure();
    const record = await RecoverTokensModel.findOne({
      token: hash(token),
      email,
      expire: { $gt: new Date() },
    });
    if (!record) throw failure();
    return record;
  }
  async newPassword(email, password, token) {
    if (typeof password !== "string" || password.length < 8)
      throw Object.assign(
        new Error("Password must have at least 8 characters"),
        { status: 400 },
      );
    return runMongoTransaction(async (session) => {
      const record = await RecoverTokensModel.findOne({
        email,
        token: hash(token),
        expire: { $gt: new Date() },
      }).session(session);
      if (!record) throw failure();
      const user = await UserModel.findOne({ email }).session(session);
      if (!user) throw failure();
      if (user.password && isValidPassword(password, user.password))
        throw Object.assign(
          new Error("New password must differ from current password"),
          { status: 409 },
        );
      user.password = createHash(password);
      await user.save({ session });
      await RecoverTokensModel.deleteMany({ email }, { session });
    });
  }
}
export const recoveryService = new RecoveryService();
