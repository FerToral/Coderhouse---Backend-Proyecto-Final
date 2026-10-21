import { createServer } from "node:http";
import mongoose from "mongoose";
import MongoStore from "connect-mongo";
import { createApp } from "./app.js";
import { connectMongo } from "./utils/connect-db.js";
import { connectSocket } from "./utils/connect-socket.js";
import env, { validateEnvironment } from "./config/config.js";
import { logger } from "./utils/logger.js";

try {
  validateEnvironment();
  await connectMongo();
  const store = MongoStore.create({
    client: mongoose.connection.getClient(),
    ttl: 86400 * 7,
  });
  const app = createApp({
    sessionStore: store,
    healthCheck: () => mongoose.connection.readyState === 1,
  });
  const server = createServer(app);
  app.locals.chatIO = connectSocket(server, app.locals.sessionMiddleware);
  server.listen(env.port, env.host, () =>
    logger.info("Ecommerce disponible en http://localhost:" + env.port),
  );
  const shutdown = () =>
    app.locals.chatIO.close(async () => {
      await store.close();
      await mongoose.disconnect();
      process.exit(0);
    });
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
} catch {
  // No imprimir errores de drivers: podrían incluir una URI o configuración sensible.
  logger.error(
    "No se pudo iniciar. Revisar MONGO_URL, SESSION_SECRET y conexión Mongo.",
  );
  process.exitCode = 1;
}
