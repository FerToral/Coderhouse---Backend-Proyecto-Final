import { recoveryService } from "../services/recovery.services.js";
class RecoveryController {
  async sendEmail(req, res, next) {
    try {
      await recoveryService.sendEmail(
        req.body.email,
        req.app.locals.sendNotification,
      );
      res.render("recovery", {
        msg: "Si la cuenta existe, enviamos un enlace válido por una hora.",
      });
    } catch (err) {
      next(err);
    }
  }
  async findToken(req, res) {
    try {
      await recoveryService.findToken(req.query.token, req.query.email);
      res.render("recovery-pass", {
        token: req.query.token,
        email: req.query.email,
      });
    } catch {
      res
        .status(410)
        .render("recovery", {
          msg: "El enlace venció o no es válido. Podés pedir uno nuevo.",
        });
    }
  }
  async newPassword(req, res, next) {
    try {
      await recoveryService.newPassword(
        req.body.email,
        req.body.password,
        req.body.token,
      );
      res.render("login-form", {
        msg: "Contraseña actualizada. Ingresá nuevamente.",
      });
    } catch (err) {
      next(err);
    }
  }
}
export const recoveryController = new RecoveryController();
