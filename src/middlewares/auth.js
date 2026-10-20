export function isUser(req, res, next) {
  if (req.session?.user?.email) return next();
  return res.status(401).json({ status: "error", msg: "Login required" });
}
export function isAdmin(req, res, next) {
  if (!req.session?.user?.email)
    return res.status(401).json({ status: "error", msg: "Login required" });
  if (req.session.user.rol === "admin") return next();
  return res
    .status(403)
    .json({ status: "error", msg: "Administrator required" });
}
export function checkUser(req, res, next) {
  return req.session?.user?.email ? next() : res.redirect("/login");
}
export function checkAdmin(req, res, next) {
  if (req.session?.user?.rol === "admin") return next();
  return res
    .status(403)
    .render("error-page", { msg: "Acceso reservado a administración." });
}
export function getSession(req, res, next) {
  req.sessionData = req.session?.user || {};
  return next();
}
