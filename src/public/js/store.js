(() => {
  const message = document.querySelector("#store-message");
  const root = document.querySelector("[data-cart]");
  const cart = root?.dataset.cart;
  let busy = false;
  function say(text) {
    if (message) message.textContent = text;
  }
  async function request(url, method, body) {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.msg || result.data || "No se pudo completar la operación.",
      );
    return result;
  }
  document.querySelectorAll("[data-add]").forEach((button) =>
    button.addEventListener("click", async () => {
      if (!cart) {
        say("Ingresá a tu cuenta para comprar.");
        return;
      }
      button.disabled = true;
      try {
        await request(
          "/api/carts/" + cart + "/products/" + button.dataset.add,
          "POST",
        );
        say("Producto agregado. Podés revisar tu carrito desde la navegación.");
      } catch (error) {
        say(error.message);
      } finally {
        button.disabled = false;
      }
    }),
  );
  document.querySelectorAll("[data-remove]").forEach((button) =>
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await request(
          "/api/carts/" + cart + "/products/" + button.dataset.remove,
          "DELETE",
        );
        location.reload();
      } catch (error) {
        say(error.message);
        button.disabled = false;
      }
    }),
  );
  document.querySelectorAll("[data-quantity]").forEach((input) =>
    input.addEventListener("change", async () => {
      const quantity = Number(input.value);
      if (!Number.isSafeInteger(quantity) || quantity < 1) {
        say("Usá una cantidad entera mayor a cero.");
        return;
      }
      input.disabled = true;
      try {
        await request(
          "/api/carts/" + cart + "/products/" + input.dataset.quantity,
          "PUT",
          { quantity },
        );
        location.reload();
      } catch (error) {
        say(error.message);
        input.disabled = false;
      }
    }),
  );
  document
    .querySelector("#purchase")
    ?.addEventListener("click", async (event) => {
      if (busy) return;
      busy = true;
      event.currentTarget.disabled = true;
      say("Confirmando tu compra…");
      try {
        const result = await request(
          "/api/carts/" + cart + "/purchase",
          "POST",
        );
        if (!result.ticket) {
          say("No hay stock suficiente. Tu carrito se conserva sin cargos.");
          busy = false;
          event.target.disabled = false;
          return;
        }
        // Recibo protegido por cuenta, consultado de nuevo desde el servidor.
        location.assign(
          "/carts/" +
            cart +
            "/tickets/" +
            result.ticket.code +
            (result.productsNotPurchased.length ? "?partial=1" : ""),
        );
      } catch (error) {
        say(error.message);
        busy = false;
        event.target.disabled = false;
      }
    });
})();
