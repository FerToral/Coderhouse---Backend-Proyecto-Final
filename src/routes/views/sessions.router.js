import passport from "passport";
import { Router } from "express";
import env from "../../config/config.js";
import { sessionController } from "../../controllers/sessions.controller.js";
const router = Router();
router.get("/github", (req, res, next) => {
  if (!env.githubClientId || !env.githubClientSecret)
    return res
      .status(503)
      .render("error-page", {
        msg: "OAuth no configurado. Podés ingresar con correo y contraseña.",
      });
  passport.authenticate("github", { scope: ["user:email"] })(req, res, next);
});
router.get(
  "/githubcallback",
  passport.authenticate("github", { failureRedirect: "/login" }),
  sessionController.githubAuth,
);
export default router;
