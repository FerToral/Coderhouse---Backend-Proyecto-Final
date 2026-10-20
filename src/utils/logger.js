import winston from "winston";
const production = process.env.NODE_ENV === "production";
const testing = process.env.NODE_ENV === "test";
export const logger = winston.createLogger({
  levels: { fatal: 0, error: 1, warning: 2, info: 3, http: 4, debug: 5 },
  silent: testing,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({ level: production ? "info" : "debug" }),
    ...(!testing
      ? [
          new winston.transports.File({
            filename: "errors.log",
            level: "error",
          }),
        ]
      : []),
  ],
});
export function addLogger(req, res, next) {
  req.logger = logger;
  // No registrar cuerpos, cookies ni query strings (pueden contener tokens de recuperación).
  req.logger.http(req.method + " " + req.path);
  next();
}
