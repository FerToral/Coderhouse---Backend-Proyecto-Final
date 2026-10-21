import dotenv from "dotenv";
import { Command } from "commander";

export const program = new Command()
  .allowUnknownOption()
  .option("--mode <mode>", "development, test o production")
  .option("--dao <dao>", "Persistencia Mongo", "mongo");
program.parse(process.argv);
if (program.opts().dao.toLowerCase() !== "mongo")
  throw new Error(
    "El ecommerce final requiere Mongo. Para memoria/archivos usar npm run practica:archivos.",
  );
const mode = program.opts().mode || process.env.NODE_ENV || "development";
if (!["development", "test", "production"].includes(mode))
  throw new Error("Invalid NODE_ENV");
if (mode !== "test") {
  dotenv.config({ path: ".env.local" });
  dotenv.config({ path: ".env." + mode });
}
const env = {
  mode,
  dao: "mongo",
  persistence: "MONGO",
  port: Number(process.env.PORT || 8080),
  host: process.env.HOST || (mode === "production" ? "0.0.0.0" : "127.0.0.1"),
  trustProxy: process.env.TRUST_PROXY === "1" ? 1 : false,
  uploadRoot: process.env.UPLOAD_ROOT,
  mongoUrl: process.env.MONGO_URL,
  sessionSecret: process.env.SESSION_SECRET,
  apiUrl: process.env.API_URL || "http://localhost:8080",
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  googleEmail: process.env.GOOGLE_EMAIL,
  googlePass: process.env.GOOGLE_PASS,
};
export function validateEnvironment() {
  if (process.env.TRUST_PROXY && !["0", "1"].includes(process.env.TRUST_PROXY))
    throw new Error("TRUST_PROXY must be 0 or 1");
  if (!env.mongoUrl) throw new Error("MONGO_URL is required");
  if (!env.sessionSecret || env.sessionSecret.length < 32)
    throw new Error("SESSION_SECRET must have at least 32 characters");
  if (!Number.isInteger(env.port) || env.port < 0 || env.port > 65535)
    throw new Error("Invalid PORT");
}
export default env;
