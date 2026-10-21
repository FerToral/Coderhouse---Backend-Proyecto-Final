const socket = io();
const form = document.getElementById("chat-form");
const input = document.getElementById("input-msg");
const status = document.getElementById("chat-status");
const messages = document.getElementById("div-msgs");
const button = form.querySelector("button");

socket.on("all_msgs", (entries) => {
  const fragment = document.createDocumentFragment();
  for (const entry of entries) {
    const item = document.createElement("li");
    const author = document.createElement("strong");
    const text = document.createElement("p");
    author.textContent = entry.user;
    text.textContent = entry.message; // Nunca interpretar contenido del usuario como HTML.
    item.append(author, text);
    fragment.append(item);
  }
  messages.replaceChildren(fragment);
  status.textContent = entries.length
    ? "Conversación actualizada."
    : "Todavía no hay mensajes.";
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = input.value.trim();
  if (!message || message.length > 1000) return;
  button.disabled = true;
  socket
    .timeout(5000)
    .emit("msg_front_to_back", { message }, (error, response) => {
      button.disabled = false;
      if (error || !response?.ok) {
        status.textContent =
          response?.error || "No se confirmó el envío. Tu texto se conserva.";
        return;
      }
      input.value = "";
      input.focus();
      status.textContent = "Mensaje enviado.";
    });
});
socket.on("connect_error", () => {
  status.textContent =
    "No se pudo conectar. Revisá tu sesión e intentá ingresar nuevamente.";
});
socket.on("disconnect", () => {
  status.textContent =
    "Chat desconectado. Los mensajes no enviados permanecen en el campo.";
});
socket.on("chat-error", (message) => {
  status.textContent = message;
});
