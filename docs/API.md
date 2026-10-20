# API y políticas

Todas las mutaciones de carrito requieren sesión de cliente y propiedad del carrito. La sesión contiene sólo identidad mínima y el rol/carrito se actualizan desde Mongo en cada petición autenticada.

| Ruta                                 | Acceso y operación                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| GET /api/products                    | Público; limit (1–100), page (1–100000), sort asc/desc por precio, query por categoría o true/false |
| GET /api/products/:pid               | Público; producto existente                                                                         |
| POST /api/products                   | Admin/premium; código único, campos validados, propietario asignado por servidor                    |
| PUT /api/products/:pid               | Admin o premium dueño; no puede cambiar propietario ni ID                                           |
| DELETE /api/products/:pid            | Admin o premium dueño; notifica si el producto tiene dueño premium                                  |
| GET /api/carts/:cid                  | Cliente propietario; productos completos mediante populate                                          |
| POST /api/carts/:cid/products/:pid   | Agrega una unidad; rechaza producto propio, deshabilitado o sin existencias                         |
| PUT /api/carts/:cid/products/:pid    | Cantidad entera positiva en body.quantity; stock se admite como alias histórico                     |
| PUT /api/carts/:cid                  | Array de {product,quantity}, sin duplicados; la compra vuelve a comprobar propiedad/stock           |
| DELETE /api/carts/:cid/products/:pid | Quita el producto del carrito                                                                       |
| DELETE /api/carts/:cid               | Vacía el carrito                                                                                    |
| POST /api/carts/:cid/purchase        | Compra transaccional; PUT se mantiene como alias                                                    |
| GET /api/sessions/current            | Identidad mínima; nunca hash de contraseña                                                          |
| GET /api/users                       | Sólo admin; nombre, correo y rol, con ID para administración                                        |
| DELETE /api/users                    | Sólo admin; bajas por inactividad de más de dos días y notificación; no incluye admins              |
| DELETE /api/users/:uid               | Sólo admin; no borra administradores                                                                |
| PUT /api/users/:uid/role             | Sólo admin; rol user/premium, con comprobantes para ascender                                        |
| PATCH /api/users/premium/:uid        | Alterna user/premium con los mismos requisitos                                                      |
| POST /api/users/:uid/documents       | Titular/admin; multipart, máximo 5 archivos de 5 MB                                                 |
| GET /api/users/:uid/documents/:name  | Descarga privada del titular/admin                                                                  |

Documentos para premium: identificacion, comprobante_domicilio y comprobante_estado_cuenta. Archivos con firma PDF/PNG/JPEG; profile y product aceptan imágenes. No se aceptan nombres de archivo aportados por el cliente como ruta de almacenamiento. La comprobación de firma no reemplaza un antivirus para un despliegue real.

Registro y acceso: POST /register, POST /login, POST /logout. Vistas de recuperación: GET/POST /recovery y GET/POST /recovery/pass. Un enlace vence a la hora, no permite reutilizar la contraseña y se consume al actualizar. Los tokens se guardan como hash y no se registran query strings.

## Resultado de compra

201 si se generó ticket; 200 si ningún producto pudo comprarse. Respuesta:

```json
{
  "status": "success",
  "ticket": null,
  "productsNotPurchased": ["id-no-disponible"]
}
```

Cuando existe ticket incluye code, purchase_datetime, amount y purchaser. Stock, ticket y carrito se escriben dentro de la misma transacción y la respuesta se entrega después del commit. Los no comprados permanecen en el carrito. Dos peticiones sobre el mismo carrito no producen dos tickets; una segunda petición tras vaciarlo devuelve error. No es una API de pago ni un sistema distribuido de idempotencia por clave.

Errores: 400 datos inválidos/carrito vacío, 401 falta de sesión, 403 acceso ajeno o rol insuficiente, 404 recurso inexistente, 409 conflicto de stock/rol o código, 410 recuperación vencida, 503 transporte/servicio no configurado. Algunas rutas históricas conservan mensajes/códigos que requieren homogeneización adicional.

## Notificaciones y concurrencia

Se comprueban con un transporte simulado en las pruebas. Una baja por inactividad no elimina una cuenta si falla su correo; una conexión producida durante el envío cancela el borrado. El envío externo y el borrado no son una transacción distribuida: para producción convendría un outbox/cola con reintentos y auditoría. No se añade infraestructura de ese tamaño a este ejercicio académico.

Las cargas fallidas pueden dejar un archivo huérfano si falla Mongo después de escribirlo; no se expone públicamente, pero falta una política de limpieza. No iniciar tareas automáticas que borren datos reales para probar la consigna.
