import { Router } from "express";
import { checkAdmin } from "../../middlewares/auth.js";
import { UserModel } from "../../dao/models/users.model.js";
const router = Router();
router.get("/", checkAdmin, async (req, res, next) => {
  try {
    const users = await UserModel.find({})
      .select("firstName lastName email rol last_connection documents")
      .lean();
    res.render("users", {
      title: "Usuarios · CityCode",
      users: users.map((user) => ({
        ...user,
        _id: String(user._id),
        protected: user.rol === "admin",
      })),
    });
  } catch (err) {
    next(err);
  }
});
export { router as usersHtmlRouter };
