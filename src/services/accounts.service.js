import { UserModel } from "../dao/models/users.model.js";
export const requiredDocuments = [
  "identificacion",
  "comprobante_domicilio",
  "comprobante_estado_cuenta",
];
export function canBecomePremium(user) {
  return requiredDocuments.every((name) =>
    user.documents?.some((document) => document.name === name),
  );
}
export async function setRole(id, role) {
  if (!["user", "premium"].includes(role))
    throw Object.assign(new Error("Only user or premium can be assigned"), {
      status: 400,
    });
  const user = await UserModel.findById(id);
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  if (user.rol === "admin")
    throw Object.assign(new Error("Administrator cannot be changed here"), {
      status: 403,
    });
  if (role === "premium" && !canBecomePremium(user))
    throw Object.assign(
      new Error("Identification, address and account statement are required"),
      { status: 409 },
    );
  user.rol = role;
  await user.save();
  return user;
}
export async function removeInactiveAccounts(send, now = new Date()) {
  const cutoff = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const filter = {
    rol: { $ne: "admin" },
    $or: [
      { last_connection: { $lt: cutoff } },
      { last_connection: null, createdAt: { $lt: cutoff } },
    ],
  };
  const users = await UserModel.find(filter);
  let deleted = 0;
  for (const user of users) {
    await send({
      to: user.email,
      subject: "Cuenta eliminada por inactividad",
      text: "Tu cuenta académica CityCode fue eliminada tras dos días sin actividad.",
    });
    // Una conexión ocurrida durante el envío cancela el borrado de esa cuenta.
    const result = await UserModel.deleteOne({ _id: user._id, ...filter });
    deleted += result.deletedCount;
  }
  return { deleted };
}
