import { Server } from "socket.io";
import { MsgModel } from "../dao/models/msgs.model.js";
export function connectSocket(server, sessionMiddleware) {
  const io = new Server(server, { cors: false });
  io.engine.use(sessionMiddleware);
  io.use((socket, next) => {
    const user = socket.request.session?.user;
    return user?.email && user.rol !== "admin"
      ? next()
      : next(new Error("Login required"));
  });
  io.on("connection", (socket) => {
    // Producto/carrito: mutaciones exclusivamente por REST, con políticas y propietario.
    socket.on("msg_front_to_back", async (message) => {
      try {
        const text =
          typeof message?.message === "string"
            ? message.message.trim().slice(0, 1000)
            : "";
        if (!text) return;
        await MsgModel.create({
          user: socket.request.session.user.email,
          message: text,
        });
        io.emit(
          "all_msgs",
          await MsgModel.find({}).sort({ _id: -1 }).limit(100).lean(),
        );
      } catch {
        socket.emit("chat-error", "No se pudo enviar el mensaje.");
      }
    });
  });
  return io;
}
