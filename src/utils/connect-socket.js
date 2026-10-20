import { Server } from "socket.io";
import { MsgModel } from "../dao/models/msgs.model.js";
import { UserModel } from "../dao/models/users.model.js";

export function sameOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true; // CLI no-browser; la sesión sigue siendo obligatoria.
  try {
    const url = new URL(origin);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      url.host === request.headers.host
    );
  } catch {
    return false;
  }
}

export async function authorizeChat(request) {
  if (!request.session) throw new Error("Login required");
  await new Promise((resolve, reject) =>
    request.session.reload((error) => (error ? reject(error) : resolve())),
  );
  const id = request.session?.user?._id;
  const user = id
    ? await UserModel.findById(id).select("email rol").lean()
    : null;
  if (!user || !["user", "premium"].includes(user.rol))
    throw new Error("Chat access denied");
  return user;
}

async function recentMessages() {
  const messages = await MsgModel.find({})
    .sort({ _id: -1 })
    .limit(100)
    .select("user message")
    .lean();
  return messages.reverse();
}

export function connectSocket(server, sessionMiddleware) {
  const io = new Server(server, {
    cors: false,
    maxHttpBufferSize: 16 * 1024,
    allowRequest: (req, done) => done(null, sameOrigin(req)),
  });
  io.engine.use(sessionMiddleware);
  io.use(async (socket, next) => {
    try {
      await authorizeChat(socket.request);
      next();
    } catch {
      next(new Error("Login required"));
    }
  });
  io.on("connection", async (socket) => {
    const sessionId = socket.request.session.id;
    socket.join(sessionId);
    let windowStart = Date.now(),
      sent = 0;
    socket.on("msg_front_to_back", async (message, acknowledge) => {
      const ack = typeof acknowledge === "function" ? acknowledge : () => {};
      try {
        const user = await authorizeChat(socket.request);
        const text =
          typeof message?.message === "string" ? message.message.trim() : "";
        if (!text || text.length > 1000) {
          ack({
            ok: false,
            error: "Escribí un mensaje de 1 a 1000 caracteres.",
          });
          return;
        }
        if (Date.now() - windowStart >= 10000) {
          windowStart = Date.now();
          sent = 0;
        }
        if (sent >= 5) {
          ack({
            ok: false,
            error: "Esperá unos segundos antes de enviar más mensajes.",
          });
          return;
        }
        sent++;
        await MsgModel.create({ user: user.email, message: text });
        const messages = await recentMessages();
        // Revalidar también receptores: una sesión cerrada o cuenta eliminada
        // no debe seguir recibiendo el chat en un socket ya conectado.
        await Promise.all(
          [...io.sockets.sockets.values()].map(async (client) => {
            try {
              await authorizeChat(client.request);
              client.emit("all_msgs", messages);
            } catch {
              client.disconnect(true);
            }
          }),
        );
        ack({ ok: true });
      } catch {
        ack({
          ok: false,
          error: "La sesión no está disponible. Volvé a ingresar.",
        });
        socket.disconnect(true);
      }
    });
    try {
      socket.emit("all_msgs", await recentMessages());
    } catch {
      socket.emit("chat-error", "No se pudo cargar el historial.");
    }
  });
  return io;
}
