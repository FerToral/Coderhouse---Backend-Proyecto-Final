import { beginSession } from "../utils/session-user.js";
class RegisterController {
  getRegisterForm(req, res) {
    return res.render("register-form");
  }
  async registerUser(req, res, next) {
    try {
      if (!req.user)
        return res
          .status(400)
          .render("register-form", { msg: "No se pudo crear la cuenta." });
      await beginSession(req, req.user);
      return res.redirect("/products");
    } catch (err) {
      next(err);
    }
  }
  failRegister(req, res) {
    return res
      .status(400)
      .render("register-form", { msg: "Revisá los datos de la cuenta." });
  }
}
export const registerController = new RegisterController();
