const accountMessage = document.querySelector("#account-message");
async function updateAccount(url, method, body) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.msg || "No se pudo actualizar");
}
document.querySelectorAll("[data-role]").forEach((button) =>
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      await updateAccount(
        "/api/users/" + button.dataset.role + "/role",
        "PUT",
        { rol: document.querySelector("#role-" + button.dataset.role).value },
      );
      location.reload();
    } catch (error) {
      accountMessage.textContent = error.message;
      button.disabled = false;
    }
  }),
);
document.querySelectorAll("[data-delete-user]").forEach((button) =>
  button.addEventListener("click", async () => {
    if (!confirm("¿Eliminar esta cuenta? Esta acción no se puede deshacer."))
      return;
    button.disabled = true;
    try {
      await updateAccount("/api/users/" + button.dataset.deleteUser, "DELETE");
      location.reload();
    } catch (error) {
      accountMessage.textContent = error.message;
      button.disabled = false;
    }
  }),
);
