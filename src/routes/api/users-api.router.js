import { Router } from "express";
import { UserModel } from "../../dao/models/users.model.js";
import { UserDTO } from "../../dtos/userDTO.js";
import { isAdmin, isUser } from "../../middlewares/auth.js";
import { ownsAccount, uploadDocuments } from "../../middlewares/documents.js";
import {
  setRole,
  removeInactiveAccounts,
} from "../../services/accounts.service.js";
import path from "node:path";
const router = Router();
router.get("/", isAdmin, async (req, res, next) => {
  try {
    const users = await UserModel.find({}).select(
      "firstName lastName email rol",
    );
    res.json({
      status: "success",
      data: users.map((user) => new UserDTO(user)),
    });
  } catch (err) {
    next(err);
  }
});
router.delete("/", isAdmin, async (req, res, next) => {
  try {
    res.json({
      status: "success",
      ...(await removeInactiveAccounts(req.app.locals.sendNotification)),
    });
  } catch (err) {
    next(err);
  }
});
router.post("/:uid/documents", isUser, ownsAccount, uploadDocuments);
router.get(
  "/:uid/documents/:name",
  isUser,
  ownsAccount,
  async (req, res, next) => {
    try {
      const user = await UserModel.findById(req.params.uid);
      const document = user?.documents.find(
        (document) => document.name === req.params.name,
      );
      if (!document)
        return res
          .status(404)
          .json({ status: "error", msg: "Document not found" });
      const root = path.resolve(req.app.locals.uploadRoot),
        file = path.resolve(root, document.reference);
      if (!file.startsWith(root + path.sep))
        return res
          .status(403)
          .json({ status: "error", msg: "Invalid document reference" });
      res.download(file, req.params.name + path.extname(file), (err) => {
        if (err && !res.headersSent) next(err);
      });
    } catch (err) {
      next(err);
    }
  },
);
router.patch("/premium/:uid", isAdmin, async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.uid);
    if (!user)
      return res.status(404).json({ status: "error", msg: "User not found" });
    const changed = await setRole(
      user._id,
      user.rol === "premium" ? "user" : "premium",
    );
    res.json({ status: "success", payload: new UserDTO(changed) });
  } catch (err) {
    next(err);
  }
});
router.put("/:uid/role", isAdmin, async (req, res, next) => {
  try {
    res.json({
      status: "success",
      payload: new UserDTO(await setRole(req.params.uid, req.body.rol)),
    });
  } catch (err) {
    next(err);
  }
});
router.delete("/:uid", isAdmin, async (req, res, next) => {
  try {
    if (req.params.uid === req.session.user._id)
      return res
        .status(409)
        .json({ status: "error", msg: "Cannot delete current administrator" });
    const result = await UserModel.deleteOne({
      _id: req.params.uid,
      rol: { $ne: "admin" },
    });
    if (!result.deletedCount)
      return res
        .status(404)
        .json({ status: "error", msg: "User not found or protected" });
    res.json({ status: "success" });
  } catch (err) {
    next(err);
  }
});
export { router as usersApiRouter };
