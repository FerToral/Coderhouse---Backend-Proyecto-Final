export function sessionUser(user) {
  return {
    _id: String(user._id),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    rol: user.rol,
    cart: user.cart ? String(user.cart) : null,
  };
}
export async function beginSession(req, user) {
  // Passport conserva su propia sesión; regenerar después y recrear sólo identidad mínima.
  await new Promise((resolve, reject) =>
    req.session.regenerate((err) => (err ? reject(err) : resolve())),
  );
  req.session.user = sessionUser(user);
  await new Promise((resolve, reject) =>
    req.session.save((err) => (err ? reject(err) : resolve())),
  );
}
