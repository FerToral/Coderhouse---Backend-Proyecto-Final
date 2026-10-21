import express from "express";
import session from "express-session";
import passport from "passport";
import handlebars from "express-handlebars";
import path from "node:path";
import { fileURLToPath } from "node:url";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUiExpress from "swagger-ui-express";
import { apiDocumentation } from "./docs/openapi.js";
import { initializePassport } from "./config/passport.config.js";
import env from "./config/config.js";
import { addLogger } from "./utils/logger.js";
import { isAdmin, isUser } from "./middlewares/auth.js";
import productsApiRouter from "./routes/api/products-api.router.js";
import cartsApiRouter from "./routes/api/carts-api.router.js";
import sessionsApiRouter from "./routes/api/sessions-api.router.js";
import { usersApiRouter } from "./routes/api/users-api.router.js";
import productsRouter from "./routes/views/products.router.js";
import cartsRouter from "./routes/views/carts.router.js";
import registerRouter from "./routes/views/register.router.js";
import loginRouter from "./routes/views/login.router.js";
import logoutRouter from "./routes/views/logout.router.js";
import sessionsRouter from "./routes/views/sessions.router.js";
import profileRouter from "./routes/views/profile.router.js";
import homeRouter from "./routes/views/home.router.js";
import chatsRouter from "./routes/views/chats.router.js";
import recoveryRouter from "./routes/views/recovery.js";
import { usersHtmlRouter } from "./routes/views/users.router.js";
import { UserModel } from "./dao/models/users.model.js";
import { sessionUser } from "./utils/session-user.js";
import { sendNotification } from "./utils/notifications.js";
import loggerRouter from "./routes/api/logger-api.router.js";
import mockingRouter from "./routes/api/mocking.router.js";
import errorResponse from "./middlewares/errors/index.js";

const root = path.dirname(fileURLToPath(import.meta.url));
export function createApp({
  sessionStore,
  sessionSecret = env.sessionSecret,
  mailer = sendNotification,
  uploadRoot = env.uploadRoot || path.resolve("uploads"),
  healthCheck = () => false,
} = {}) {
  if (!sessionSecret || sessionSecret.length < 32)
    throw new Error("SESSION_SECRET must have at least 32 characters");
  if (!sessionStore && env.mode === "production")
    throw new Error("Persistent session store required");
  const app = express();
  app.locals.sendNotification = mailer;
  app.locals.uploadRoot = uploadRoot;
  app.disable("x-powered-by");
  app.set("trust proxy", env.trustProxy);
  app.get("/healthz", async (req, res) => {
    try {
      const ready = await healthCheck();
      res
        .status(ready ? 200 : 503)
        .json({ status: ready ? "ok" : "unavailable" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false, limit: "100kb" }));
  const sessionMiddleware = session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.mode === "production",
      maxAge: 86400000,
    },
  });
  app.locals.sessionMiddleware = sessionMiddleware;
  app.use(sessionMiddleware);
  // Bloquea mutaciones desde otros sitios; clientes no-browser sin Origin siguen admitidos.
  app.use((req, res, next) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && req.get("Origin")) {
      try {
        if (new URL(req.get("Origin")).host !== req.get("host"))
          return res
            .status(403)
            .json({ status: "error", msg: "Invalid origin" });
      } catch {
        return res.status(403).json({ status: "error", msg: "Invalid origin" });
      }
    }
    next();
  });
  initializePassport();
  app.use(passport.initialize(), passport.session(), addLogger);
  app.use(async (req, res, next) => {
    try {
      if (req.session?.user?._id) {
        const user = await UserModel.findById(req.session.user._id)
          .select("firstName lastName email rol cart")
          .lean();
        if (!user) {
          delete req.session.user;
          return next();
        }
        req.session.user = sessionUser(user);
      }
      next();
    } catch (err) {
      next(err);
    }
  });
  app.use((req, res, next) => {
    res.locals.sessionUser = req.session?.user;
    next();
  });
  app.use((req, res, next) => {
    res.locals.isAdmin = req.session?.user?.rol === "admin";
    res.set("X-Content-Type-Options", "nosniff");
    next();
  });
  app.engine(
    "handlebars",
    handlebars.engine({
      helpers: {
        money: (value) =>
          Number(value || 0).toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
      },
    }),
  );
  app.set("views", path.join(root, "views"));
  app.set("view engine", "handlebars");
  app.use(express.static(path.join(root, "public")));
  const specs = swaggerJSDoc({
    definition: apiDocumentation,
    apis: [],
  });
  app.get("/apidocs.json", (req, res) => res.json(specs));
  app.use("/apidocs", swaggerUiExpress.serve, swaggerUiExpress.setup(specs));
  app.use("/api/sessions", sessionsApiRouter);
  app.use("/api/products", productsApiRouter);
  app.use("/api/carts", isUser, cartsApiRouter);
  app.use("/api/users", usersApiRouter);
  app.use("/loggerTest", isAdmin, loggerRouter);
  app.use("/mockingproducts", isAdmin, mockingRouter);
  app.use("/register", registerRouter);
  app.use("/login", loginRouter);
  app.use("/logout", logoutRouter);
  app.use("/sessions", sessionsRouter);
  app.use("/profile", checkLogin, profileRouter);
  app.use("/users", checkLogin, usersHtmlRouter);
  app.use("/products", productsRouter);
  app.use("/carts", cartsRouter);
  app.use("/chats", isUser, chatsRouter);
  app.use("/recovery", recoveryRouter);
  app.use("/", homeRouter);
  app.use((req, res) =>
    res.status(404).render("error-page", { msg: "No encontramos esa página." }),
  );
  app.use(errorResponse);
  return app;
}
function checkLogin(req, res, next) {
  return req.session?.user ? next() : res.redirect("/login");
}
