class ChatController {
  getChat(req, res) {
    if (!["user", "premium"].includes(req.session.user.rol))
      return res
        .status(403)
        .render("error-page", { msg: "El chat está reservado a clientes." });
    return res.render("chat", { title: "Conversación · CityCode" });
  }
}
export const chatController = new ChatController();
