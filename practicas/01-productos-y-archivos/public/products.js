const status = document.getElementById("status");
function render(products) {
  const rows = products.map((product) => {
    const row = document.createElement("tr");
    for (const field of ["id", "title", "code", "price", "stock"]) {
      const cell = document.createElement("td");
      cell.textContent = String(product[field]);
      row.append(cell);
    }
    return row;
  });
  document.getElementById("products").replaceChildren(...rows);
  document.getElementById("empty")?.remove();
  status.textContent = products.length
    ? "Catálogo actualizado."
    : "Catálogo sin productos.";
}
for (const kind of ["create", "remove"])
  document.getElementById(kind).addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.target.querySelector("button");
    button.disabled = true;
    const data = Object.fromEntries(new FormData(event.target));
    try {
      const response = await fetch(
        "/api/products" +
          (kind === "remove" ? "/" + encodeURIComponent(data.id) : ""),
        {
          method: kind === "remove" ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          ...(kind === "create"
            ? {
                body: JSON.stringify({
                  ...data,
                  price: Number(data.price),
                  stock: Number(data.stock),
                }),
              }
            : {}),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.msg || "No se pudo completar la operación.");
      const list = await fetch("/api/products");
      if (!list.ok) throw new Error("No se pudo actualizar el catálogo.");
      render(await list.json());
      event.target.reset();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
if (typeof io !== "undefined") {
  const socket = io();
  socket.on("products", render);
  socket.on("disconnect", () => {
    status.textContent =
      "Sin conexión en tiempo real. Las operaciones HTTP siguen disponibles.";
  });
}
