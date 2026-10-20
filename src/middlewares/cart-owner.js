/** Un cliente sólo puede consultar o cambiar su propio carrito. */
export function requireCartOwner(req, res, next) {
  const user = req.session?.user;
  if (!user?.email) {
    return res.status(401).json({ status: "error", msg: "Login required" });
  }
  if (
    user.rol === "admin" ||
    !user.cart ||
    String(user.cart) !== String(req.params.cid)
  ) {
    return res
      .status(403)
      .json({ status: "error", msg: "Cart access forbidden" });
  }
  return next();
}
