export { isUser as authenticateUser } from "./auth.js";
export function validateFields(req, res, next) {
  if (
    typeof req.body?.email !== "string" ||
    typeof req.body?.password !== "string"
  )
    return res
      .status(400)
      .render("error-page", { msg: "Correo y contraseña requeridos." });
  next();
}
