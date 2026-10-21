import { UserModel } from "../dao/models/users.model.js";
import { cartService } from "../utils/main.js";
import { beginSession } from "../utils/session-user.js";
class LoginController {
  renderLoginPage(req, res) {
    return res.render("login-form", { title: "Ingresar · CityCode" });
  }
  async authenticateLogin(req, res, next) {
    try {
      if (!req.user)
        return res
          .status(401)
          .render("error-page", { msg: "Credenciales inválidas." });
      if (!req.user.cart && req.user.rol !== "admin")
        req.user.cart = String((await cartService.createCart())._id);
      req.user.last_connection = new Date();
      await req.user.save();
      await beginSession(req, req.user);
      return res.redirect("/products");
    } catch (err) {
      next(err);
    }
  }
  renderFailLoginPage(req, res) {
    return res
      .status(401)
      .render("login-form", { msg: "Correo o contraseña incorrectos." });
  }
  renderGithubLoginPage(req, res) {
    return res.render("login-github");
  }
  async logout(req, res, next) {
    try {
      if (req.session?.user?._id)
        await UserModel.updateOne(
          { _id: req.session.user._id },
          { last_connection: new Date() },
        );
      const sessionId = req.session.id;
      req.session.destroy((err) => {
        if (err) return next(err);
        req.app.locals.chatIO?.in(sessionId).disconnectSockets(true);
        return res.clearCookie("connect.sid").redirect("/login");
      });
    } catch (err) {
      next(err);
    }
  }
}
export const loginController = new LoginController();
