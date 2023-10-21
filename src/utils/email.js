//@ts-check

import enviroment from "../config/config.js";
import nodemailer from "nodemailer";
import { logger } from "./logger.js";


/* VALIDACION DE EMAIL */
export function IsValidEmail(email) {
    const patron = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return patron.test(email);
  }
  

export async function emailRecovery(options) {
  const transport = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    auth: {
      user: enviroment.googleEmail,
      pass: enviroment.googlePass,
    },
  });

  try {
    const result = await transport.sendMail({
      from: enviroment.googleEmail,
      ...options,
    });
    logger.info("Correo electrónico enviado exitosamente.");
    return result;
  } catch (error) {
    logger.error("Error al enviar el correo electrónico:", error);
    throw error;
  }
}