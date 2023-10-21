//@ts-check

import { logger } from "../utils/logger.js";
import { randomBytes } from "crypto";
import { IsValidEmail } from "../utils/email.js";
import { userDao, recoverTokensDao } from "../dao/factory.js";
import { emailRecovery } from "../utils/email.js";
import enviroment from "../config/config.js";
import { createHash } from "../utils/bcrypt.js";

class RecoveryService {
  async sendEmail(email) {
    try {
      if (!IsValidEmail(email)) {
        throw "Correo Electrónico inválido.";
      }

      const validEmail = email;
      const user = await userDao.getByEmail(validEmail);

      if (user) {
        const token = randomBytes(20).toString("hex");
        const expire = Date.now() + 3600000;

        const tokenSaved = await recoverTokensDao.create({
          email: validEmail,
          token,
          expire,
        });

        const emailOptions = {
          to: user.email,
          subject: "Recuperación de contraseña",
          html: `
            <div>
              <h1>Recuperación de contraseña</h1>
              <p>Estás recibiendo este correo porque has solicitado una recuperación de contraseña.</p>
              <p>Tu token de recuperación es: <span style="font-size: 16px; font-weight: bold;">${token}</span></p>
              <a href="${enviroment.apiUrl}/recovery/pass?token=${token}&email=${email}">Ingresa aquí para cambiar la contraseña.</a>
            </div>
          `,
        };
        await emailRecovery(emailOptions);

        return user.email;
      } else {
        return null;
      }
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }

  async findToken(token, email) {
    try {
      const foundToken = await recoverTokensDao.findOne({ token, email });

      if (!foundToken) {
        throw "Token no encontrado";
      }

      return foundToken;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }

  async newPassword(userEmail, password, token) {
    try {
      const foundToken = await this.findToken(token, userEmail);
      const foundUser = await userDao.getByEmail(userEmail);

      if (foundToken && foundToken.expire > Date.now() && password) {
        const hashedPassword = createHash(password);
        const updatedUser = await userDao.updateById(foundUser._id, { password: hashedPassword });

        return updatedUser;
      } else {
        if (!foundUser) {
          logger.error(`No se encontró ningún usuario con el correo electrónico: ${userEmail}`);
        }
        throw "Token inválido o caducado, o falta la contraseña.";
      }
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }
}

export const recoveryService = new RecoveryService();
