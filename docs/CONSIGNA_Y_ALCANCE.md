# Proyecto final · Programación Backend · comisión 43340

Aplicación de comercio electrónico construida progresivamente durante la cursada de Coderhouse de 2023. La referencia de implementación es el repositorio propio, commit base `60aa485fc165822ae99cd08f2bfa774cee9a20db`; las actividades independientes no sustituyen el proyecto final.

## Fuentes de la consigna

- [Manual de desafíos I](https://docs.google.com/presentation/d/18m-LE4PYwPNjcwV6dkU6aZEo7K6PPTrmtN-zYzdL8CU/edit): productos, archivos, Express, primera entrega, vistas/sockets y segunda entrega.
- [Manual II](https://docs.google.com/presentation/d/1i7eWntVScSiTCONf23o3N6ZFYldpEbbf04o3mAskT-s/edit): login, Passport, capas y tercera preentrega; contrastado con las 25 diapositivas de la copia local.
- [Manual III](https://docs.google.com/presentation/d/11btvu6TMnBHCw8UVk7aoNeeR1bjhO-WX6Q4iCr37imk/edit): errores, logger, roles, recuperación, documentación, pruebas y cierre.
- [Rúbrica del proyecto final](https://drive.google.com/file/d/1fj0ukMVLnCwk2_RNvsNqIWiy37gA62Yx/view): ejecución, políticas de sesión, compra y capas. Es una plantilla sin evaluación personal; su puntuación vacía no es una nota de Fernando.
- [Instrumentos de evaluación](https://drive.google.com/drive/folders/1NA8-ToFid3QPub9lyLVPKB7nPDnSxhHU): listas de las tres preentregas.
- [Clases de la comisión](https://drive.google.com/drive/folders/1GWHYzMpsHxAxoejp63VYRtDD6BEyI0yV): las diapositivas locales de clase 23 (17–20) y clase 24/archivo 46 (43–46) amplían el cierre.

Se enlaza material docente; no se incorpora una copia pública sin autorización de redistribución. Los archivos locales conservados y las fuentes enlazadas deben permanecer relacionados. Los números de clases del manual general (hasta 46) y los de la comisión (hasta 24) no coinciden: se relacionan por consigna, no por número. Las indicaciones internas al profesor y los marcadores de plantilla no son requisitos del alumno.

## Recorrido y verificación

“Pendiente” significa no certificado en esta revisión, no ausencia comprobada del código. La batería actual suma 70 pruebas unitarias, Mongo, HTTP y WebSocket. No equivale a aprobación docente ni despliegue validado.

| Bloque                          | Consigna y referencia                                                                                           | Estado y comprobación necesaria                                                                                                                       |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Productos en memoria y archivos | Manual I, clases 2/4: campos en inglés, código único, ID estable, CRUD persistente                              | Preservar actividades anteriores; ejecución y cobertura pendientes                                                                                    |
| API inicial                     | Manual I, clases 6/8: productos y carritos, routers, ID autogenerado, cantidad acumulada                        | Contrastar contrato real y regresiones HTTP                                                                                                           |
| Vistas y sockets                | Manual I, clase 10: listado y actualización de altas/bajas                                                      | Implementación histórica presente; validar integración y permisos                                                                                     |
| Mongo y colecciones             | Manual I, práctica integradora: productos, carritos, mensajes; preservar FileSystem                             | Arranque explícito sin secretos literales y pruebas en replica set efímero. El historial previo requiere revocación de claves                         |
| Segunda preentrega              | Manual I, clase 17: filtros, paginación, precio asc/desc, enlaces, populate y edición de carrito                | Filtros/paginación/precio, edición de carrito y límites inválidos probados por HTTP; ampliar bordes de IDs y contratos históricos                     |
| Capas, DAO y DTO                | Tercera preentrega y rúbrica                                                                                    | Mantener separación; carrito ahora inyecta dependencias, sin cargar conexiones al importar el servicio                                                |
| Roles y propiedad               | Rúbrica y manual III: admin no compra; premium no compra productos propios                                      | Verificado en HTTP y compra Mongo; roles refrescados desde base en cada petición autenticada                                                          |
| Cierre de compra                | Tercera preentrega: stock suficiente, ticket, conservar no comprados y devolver IDs                             | Servicio, middleware y adaptadores probados; compra parcial conserva no comprados                                                                     |
| Integridad de compra            | Fiabilidad de implementación, no requisito nuevo atribuido al curso                                             | Transacción Mongo verificada: rollback ante fallo de ticket/carrito, concurrencia de última unidad y doble confirmación                               |
| Errores y mocking               | Manual III, clase 32: 100 productos y errores frecuentes                                                        | Verificar implementación, formato y aislamiento                                                                                                       |
| Logger                          | Manual III, clase 34: niveles, consola dev, info prod, archivo errores y loggerTest                             | Verificar sin registrar credenciales ni datos privados                                                                                                |
| Recuperación de acceso          | Manual III, práctica 37: correo, expiración de una hora, no reutilizar contraseña, renovación del enlace        | Implementada y probada con buzón simulado: hash de token, expiración, no reutilización de contraseña ni enlace                                        |
| Premium                         | Manual III, práctica 37: owner, edición/borrado por rol, conversión user/premium                                | REST y compra protegidos; retiradas escrituras por sockets que evitaban políticas. Promoción/democión probadas                                        |
| Documentación API               | Manual III, clase 39: Swagger de productos/carritos                                                             | Reconciliar con endpoints reales y respuestas                                                                                                         |
| Pruebas HTTP                    | Manual III, clase 41: al menos tres pruebas por router products/carts/sessions; complementaria                  | Batería actual Node test + assert + Supertest, con más de tres casos por router; la consigna histórica proponía Mocha/Chai, conservados como contexto |
| Documentos y actividad          | Manual III, práctica 44; clase 23/17–20: documentos, destinos Multer, last_connection y requisitos premium      | Implementados y probados: documentos privados con límites y firma, acceso propio/admin, tres comprobantes; actividad en login/logout                  |
| Administración final            | Manual III, final; clase 24/43: GET de datos mínimos, baja por inactividad de dos días con correo y vista admin | Vista/listado, rol, baja individual y limpieza probados sobre usuarios ficticios; SMTP real pendiente                                                 |
| Aviso de borrado                | Manual III, final: correo al premium dueño del producto eliminado                                               | Probado con buzón simulado, sin enviar correo externo                                                                                                 |
| Interfaz de compra              | Manual III, final y clase 24/44: catálogo → carrito → confirmación → ticket                                     | Implementada; recorrido real en navegador y revisión estrecha/escritorio; estados vacíos/error/parcial y total visibles                               |
| Despliegue                      | Manual III, final y clase 24/45: proceso completo accesible                                                     | Pendiente; no contratar servicios ni desplegar con secretos históricos                                                                                |

## Alcance y decisiones

La pasarela de pago no se evalúa en el final según el manual III y la clase 24/45. No se añade React, Nest ni un proveedor de pagos como supuesto requisito. Las vistas administrativas de usuarios sí figuran en la consigna; el editor visual de productos no es obligatorio. Las prácticas complementarias se registran como tales, aunque algunas políticas premium también aparecen en la rúbrica final.

El manual II, diapositiva 20, presenta Factory como opcional y solicita
Repository. La comisión contiene anotaciones diferentes sobre servicio–DAO.
La implementación mantiene sus servicios y DAO; no se declara certificada
una capa Repository adicional ni se reestructura por la sola aparición
del patrón en el manual general.

### Contraste del manual II

| Diapositivas | Requisito                                     | Comprobación                                                                                                                   |
| ------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 7            | Login, bienvenida y roles                     | Login redirige a productos; vista muestra identidad. Admin se configura fuera del código, no con contraseña incrustada         |
| 10           | bcrypt y Passport local/GitHub                | Registro/login local probados; GitHub requiere nuevas claves y verificación externa                                            |
| 13–14        | Usuario, carrito y current, sesión o JWT      | Sesiones elegidas; DTO mínimo y carrito probados. No se exige implementar simultáneamente JWT                                  |
| 17           | Routing, controladores, DAO, vistas y entorno | Capas existentes; variables documentadas en ejemplo sin secretos. La petición histórica de adjuntar .env no implica publicarlo |
| 20           | Factory opcional y Repository                 | Diferencia documental anterior registrada, sin fingir patrón adicional validado                                                |
| 21–22        | Ticket, permisos y compra parcial             | Compra, rollback/concurrencia y propiedad probados; premium se incorpora por la etapa posterior                                |
| 21           | Chat para clientes, no admin                  | Handshake y cada envío/receptor recargan sesión/rol; logout corta sockets, sin mutaciones de productos por este canal          |

El chat muestra texto, nunca HTML aportado por usuarios; son mejoras de
seguridad de mantenimiento. Se ensayaron diez casos WebSocket reales y
dos unitarios. No se afirma una auditoría de seguridad exhaustiva.

La corrección nueva redondea el total del ticket a dos decimales y rechaza importes no finitos/cantidades no enteras. Es una decisión de mantenimiento, no una cita de la consigna.

La carga de documentos compensa escrituras de disco ante fallos y elimina
los archivos sustituidos sólo después de confirmar la metadata nueva.
Comprueba que Mongo ya no los referencia antes de borrarlos. Si la base
no permite aclarar un resultado incierto, conserva el archivo y registra
limpieza diferida: prioriza no perder documentos frente a prometer una
transacción distribuida inexistente. Rechaza tipos duplicados en un lote
y rutas fuera de la raíz; cinco regresiones específicas cubren estos casos.

## Validación segura

```sh
npm run test:unit
```

Las pruebas ejecutan el servicio y el middleware reales con dependencias simuladas, sin Mongo, correo, Twilio ni claves. El arranque actual no usa secretos literales ni el .env histórico. Las credenciales previas siguen en Git y necesitan revisión/revocación por su titular; no se verificó si siguen activas. Las pruebas Mongo/HTTP crean su propia base efímera y correo simulado.

Para cerrar la cursada faltan las actividades históricas, la diferencia
Repository de la comisión, servicios SMTP/OAuth reales y despliegue HTTPS
con secretos nuevos. Swagger activo cubre productos, carritos y current;
las otras rutas tienen descripción en API.md, no se presentan todas
como contratos OpenAPI certificados. La antigua vista de altas/bajas
por sockets permanece como antecedente, sin reactivar escrituras que
eludan permisos. Estas pruebas no acreditan por sí solas todo el curso.
