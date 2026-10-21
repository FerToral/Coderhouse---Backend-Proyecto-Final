import { test, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { randomBytes } from "node:crypto";
import request from "supertest";
import { io as client } from "socket.io-client";
import { startTestDatabase } from "../helpers/mongo.js";
import { UserModel } from "../../src/dao/models/users.model.js";
import { CartsModel } from "../../src/dao/models/carts.model.js";
import { MsgModel } from "../../src/dao/models/msgs.model.js";
import { connectSocket } from "../../src/utils/connect-socket.js";
process.env.NODE_ENV = "test";
const { createApp } = await import("../../src/app.js");
let app, server, url, stop, io;
const clients = new Set();
before(
  async () => {
    stop = await startTestDatabase();
    await UserModel.init();
    app = createApp({ sessionSecret: randomBytes(32).toString("hex") });
    server = createServer(app);
    io = connectSocket(server, app.locals.sessionMiddleware);
    app.locals.chatIO = io;
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    url = "http://127.0.0.1:" + server.address().port;
  },
  { timeout: 180000 },
);
beforeEach(async () => {
  await Promise.all([
    UserModel.deleteMany({}),
    CartsModel.deleteMany({}),
    MsgModel.deleteMany({}),
  ]);
});
afterEach(() => {
  for (const socket of clients) socket.disconnect();
  clients.clear();
});
after(async () => {
  if (io) await new Promise((resolve) => io.close(resolve));
  if (stop) await stop();
});
async function account(email = "client@example.test") {
  const response = await request(app)
    .post("/register")
    .type("form")
    .send({
      firstName: "Cliente",
      lastName: "Prueba",
      email,
      password: "test-chat-only",
    })
    .expect(302);
  return response.headers["set-cookie"][0].split(";")[0];
}
function socketFor(cookie, origin = url) {
  const socket = client(url, {
    autoConnect: false,
    forceNew: true,
    reconnection: false,
    timeout: 2000,
    transports: ["websocket"],
    extraHeaders: { ...(cookie ? { Cookie: cookie } : {}), Origin: origin },
  });
  clients.add(socket);
  return socket;
}
function event(socket, name) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(name, receive);
      reject(new Error("Timeout: " + name));
    }, 5000);
    function receive(value) {
      clearTimeout(timer);
      resolve(value);
    }
    socket.once(name, receive);
  });
}
async function connect(socket) {
  const connected = new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", reject);
  });
  socket.connect();
  await connected;
  return socket;
}
function send(socket, payload) {
  return new Promise((resolve, reject) =>
    socket
      .timeout(4000)
      .emit("msg_front_to_back", payload, (error, response) =>
        error ? reject(error) : resolve(response),
      ),
  );
}
test("chat: visitante y origen externo rechazados", async () => {
  await assert.rejects(connect(socketFor(null)));
  const cookie = await account();
  await assert.rejects(connect(socketFor(cookie, "https://external.invalid")));
});
test("chat: admin no entra ni accede a la vista", async () => {
  const cookie = await account();
  await UserModel.updateOne({}, { rol: "admin" });
  await assert.rejects(connect(socketFor(cookie)));
  await request(app).get("/chats/chat").set("Cookie", cookie).expect(403);
});
test("chat: identidad de sesión prevalece sobre autor enviado", async () => {
  const socket = await connect(socketFor(await account()));
  const response = await send(socket, {
    user: "spoof@example.test",
    message: "  Hola  ",
  });
  assert.equal(response.ok, true);
  const stored = await MsgModel.findOne().lean();
  assert.equal(stored.user, "client@example.test");
  assert.equal(stored.message, "Hola");
});
test("chat: historial inicial acotado y cronológico", async () => {
  const cookie = await account();
  for (let i = 0; i < 105; i++)
    await MsgModel.create({ user: "history@example.test", message: String(i) });
  const socket = socketFor(cookie);
  const history = event(socket, "all_msgs");
  await connect(socket);
  const messages = await history;
  assert.equal(messages.length, 100);
  assert.equal(messages[0].message, "5");
  assert.equal(messages.at(-1).message, "104");
});
test("chat: mensaje vacío y demasiado largo no persisten", async () => {
  const socket = await connect(socketFor(await account()));
  for (const message of ["   ", "x".repeat(1001)]) {
    assert.equal((await send(socket, { message })).ok, false);
  }
  assert.equal(await MsgModel.countDocuments(), 0);
});
test("chat: HTML se conserva como texto, no se ejecuta en el servidor", async () => {
  const socket = await connect(socketFor(await account()));
  const message = '<img src=x onerror="alert(1)">';
  assert.equal((await send(socket, { message })).ok, true);
  assert.equal((await MsgModel.findOne()).message, message);
});
test("chat: logout desconecta el socket ya abierto", async () => {
  const cookie = await account();
  const socket = await connect(socketFor(cookie));
  const disconnected = event(socket, "disconnect");
  await request(app).post("/logout").set("Cookie", cookie).expect(302);
  await disconnected;
  assert.equal(socket.connected, false);
});
test("chat: rol actualizado invalida una conexión anterior", async () => {
  const socket = await connect(socketFor(await account()));
  await UserModel.updateOne({}, { rol: "admin" });
  const disconnected = event(socket, "disconnect");
  socket.emit("msg_front_to_back", { message: "No autorizado" });
  await disconnected;
  assert.equal(await MsgModel.countDocuments(), 0);
});
test("chat: cuenta eliminada no recibe nuevos mensajes", async () => {
  const cookieA = await account("a@example.test");
  const cookieB = await account("b@example.test");
  const a = await connect(socketFor(cookieA));
  const b = await connect(socketFor(cookieB));
  await UserModel.deleteOne({ email: "b@example.test" });
  const disconnected = event(b, "disconnect");
  assert.equal((await send(a, { message: "Sólo clientes activos" })).ok, true);
  await disconnected;
});
test("chat: frecuencia limitada sin perder historial", async () => {
  const socket = await connect(socketFor(await account()));
  for (let i = 0; i < 5; i++)
    assert.equal((await send(socket, { message: "Mensaje " + i })).ok, true);
  assert.equal((await send(socket, { message: "Sexto" })).ok, false);
  assert.equal(await MsgModel.countDocuments(), 5);
});
