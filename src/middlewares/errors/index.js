import { describeError } from "../../services/errors/catalog.js";
export default function errorResponse(error, req, res, next) {
  if (res.headersSent) return next(error);
  const { status, code, message } = describeError(error);
  req.logger?.error(
    "Request failed: " + req.method + " " + req.path + " (" + status + ")",
  );
  if (/^\/(products|carts)(\/|\?|$)/.test(req.originalUrl))
    return res.status(status).render("error-page", { msg: message });
  res.status(status).json({ status: "error", code, msg: message });
}
