//@ts-check
import ticketDao from "../dao/mongo/tickets.mongo.js";
import { randomUUID } from "node:crypto";

export class TicketService {
  async generateUniqueCode() {
    const uniqueCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    const existingTicket = await ticketDao.getTicket({ code: uniqueCode });

    if (existingTicket) {
      return this.generateUniqueCode(); // Si el código ya existe, generamos uno nuevo
    }

    return uniqueCode;
  }

  async createTicket(amount, purchaser, session) {
    try {
      const ticket = {
        amount,
        purchaser,
        code: randomUUID(),
        purchase_datetime: new Date(),
      };

      const newTicket = await ticketDao.createTicket(ticket, session);
      return newTicket;
    } catch (error) {
      throw new Error("Error creating ticket");
    }
  }
}
