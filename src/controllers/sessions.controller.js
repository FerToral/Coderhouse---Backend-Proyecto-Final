import { UserDTO } from "../dtos/userDTO.js";
import { beginSession } from "../utils/session-user.js";
class SessionController {
  getProfile(req, res) {
    return res.render("profile", { user: new UserDTO(req.session.user) });
  }
  testAdmin(req, res) {
    return res.json({ status: "success", msg: "Administrator session" });
  }
  async githubAuth(req, res, next) {
    try {
      req.user.last_connection = new Date();
      await req.user.save();
      await beginSession(req, req.user);
      res.redirect("/products");
    } catch (err) {
      next(err);
    }
  }
  current(req, res) {
    return res.json({
      status: "success",
      payload: new UserDTO(req.session.user),
    });
  }
}
export const sessionController = new SessionController();
