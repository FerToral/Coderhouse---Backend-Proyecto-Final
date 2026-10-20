import { Router } from "express";
import { recoveryController } from "../../controllers/recovery.controller.js";
const router = Router();
router.get("/", (req, res) => res.render("recovery"));
router.post("/", recoveryController.sendEmail);
router.get("/pass", recoveryController.findToken);
router.post("/pass", recoveryController.newPassword);
export default router;
