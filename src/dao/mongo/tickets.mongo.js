import { TicketModel } from "../models/tickets.model.js";
class TicketDAO {
  async getTicket(params) {
    return await TicketModel.findOne(params);
  }

  async createTicket(ticket, session) {
    const [created] = await TicketModel.create([ticket], { session });
    return created;
  }
}

const ticketDao = new TicketDAO();

export default ticketDao;
