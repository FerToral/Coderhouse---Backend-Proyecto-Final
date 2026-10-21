import nodemailer from "nodemailer";
import env from "../config/config.js";
export async function sendNotification(message) {
  if (!env.googleEmail || !env.googlePass)
    throw Object.assign(new Error("Email transport is not configured"), {
      status: 503,
    });
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: env.googleEmail, pass: env.googlePass },
  });
  return transport.sendMail({ from: env.googleEmail, ...message });
}
