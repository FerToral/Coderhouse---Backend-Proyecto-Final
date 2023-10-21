//@ts-check
import express from "express";
import { logger } from "../../utils/logger.js";
import { recoveryController } from "../../controllers/recovery.controller.js";

const recovery = express.Router();

recovery.get("/", async (req, res) => {
  try {
    const title = "Fuego Burgers®";
    return res.status(200).render("recovery", { title });
  } catch (e) {
    logger.error(e.message);
    res
      .status(501)
      .send({ status: "error", msg: "Error en el servidor", error: e });
  }
});

recovery.post("/", recoveryController.sendEmail);
recovery.get("/pass", recoveryController.findToken);
recovery.post("/pass", recoveryController.newPassword)

export default recovery;