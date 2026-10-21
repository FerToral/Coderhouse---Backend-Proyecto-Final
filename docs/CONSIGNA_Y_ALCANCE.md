# Proyecto final · Programación Backend · comisión 43340

Ecommerce desarrollado durante la cursada de Coderhouse de 2023. El recorrido
va desde ProductManager hasta compras, cuentas, administración y despliegue.
Las primeras entregas se ejecutan en [prácticas](../practicas/01-productos-y-archivos/README.md);
la aplicación principal conserva Mongo y sus políticas de sesión.

## Fuentes de las consignas

- [Manual I](https://docs.google.com/presentation/d/18m-LE4PYwPNjcwV6dkU6aZEo7K6PPTrmtN-zYzdL8CU/edit): memoria, archivos, Express, vistas/sockets y primeras dos preentregas.
- [Manual II](https://docs.google.com/presentation/d/1i7eWntVScSiTCONf23o3N6ZFYldpEbbf04o3mAskT-s/edit): acceso, capas, Repository, ticket y tercera preentrega; referencia por diapositiva.
- [Manual III](https://docs.google.com/presentation/d/11btvu6TMnBHCw8UVk7aoNeeR1bjhO-WX6Q4iCr37imk/edit): mocking, logger, recuperación, premium, documentación, pruebas y final.
- [Rúbrica final](https://drive.google.com/file/d/1fj0ukMVLnCwk2_RNvsNqIWiy37gA62Yx/view): ejecución, sesiones, compra y arquitectura. La copia localizada es una plantilla, no una evaluación personal.
- [Listas de preentregas](https://drive.google.com/drive/folders/1NA8-ToFid3QPub9lyLVPKB7nPDnSxhHU).
- [Clases de la comisión](https://drive.google.com/drive/folders/1GWHYzMpsHxAxoejp63VYRtDD6BEyI0yV): clase 23, diapositivas 17–20, y clase 24 (archivo 46), 43–46, precisan documentos y cierre.

El manual general y la comisión usan numeraciones distintas: se relacionan
por tema y entrega. Los marcadores “editar” e instrucciones para docentes
no agregan requisitos. Se enlaza el material; no se redistribuyen copias
sin permiso acreditado.

El checklist de segunda entrega pide además error para páginas e IDs
inexistentes: los casos HTTP específicos verifican ambos y conservan
un catálogo vacío válido en la página1. La plantilla del checklist no
acredita una calificación personal.

## Primer módulo

| ID   | Entrega y requisito                                                                                                            | Implementación y comprobación                                                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| I-01 | Clase 2: productos vacíos, campos en inglés, obligatorios, code único, ID generado, consulta y Not Found                       | ProductManager en memoria; firma original de seis campos; test/unit/archivos.test.js                                      |
| I-02 | Clase 4: constructor con path, CRUD asíncrono, persistencia e ID inmutable                                                     | ProductManager con archivo; cola, JSON y contador persistente; reinicio, concurrencia, errores y copia defensiva probados |
| I-03 | Clase 6: Express, GET productos, limit opcional y pid                                                                          | API de prácticas; límites e identificadores validados                                                                     |
| I-04 | Primera preentrega: routers productos/carritos, CRUD y campos id/title/description/code/price/status/stock/category/thumbnails | API de prácticas; ID generado y cantidad acumulada; JSON de productos/carritos separados                                  |
| I-05 | Clase 10: Handlebars, home y realtimeproducts; altas/bajas reflejadas por sockets                                              | Vistas de prácticas, mutaciones HTTP y sockets de lectura; prueba real entre pestañas                                     |
| I-06 | Integradora: Mongo, productos/carritos/mensajes y conservar FileSystem                                                         | Aplicación principal en Mongo; etapa de archivos ejecutable sin sustituir las transacciones finales                       |
| I-07 | Segunda preentrega: limit10/page1, filtros categoría/disponibilidad, orden precio, metadata y enlaces                          | ProductService → Repository → DAO; API HTTP y Mocha prueban filtro/orden/páginas                                          |
| I-08 | Carrito: populate, borrar ítem/vaciar, reemplazar ítems, modificar cantidad; vistas products/carts                             | Rutas API y vistas del ecommerce; pruebas HTTP y Mongo                                                                    |

## Segundo módulo

| ID    | Fuente y requisito                                                                      | Implementación y comprobación                                                                                                              |
| ----- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| II-01 | Manual II/7: login, redirección a productos, bienvenida, rol                            | Passport local, sesión y vistas; pruebas de acceso HTTP                                                                                    |
| II-02 | II/10: bcrypt, estrategias local y GitHub                                               | Registro con hash y login local probados; GitHub implementado, validación externa pendiente                                                |
| II-03 | II/13–14: datos de usuario, carrito, rol por defecto user, current seguro, sesión o JWT | Modelo User, carrito automático y UserDTO; se eligen sesiones. Nombres firstName/lastName/rol conservan el contrato propio                 |
| II-04 | II/17: routing, controladores, DAO, vistas, entorno                                     | Separación en src; .env.example sin secretos. El arranque no abre conexiones al importar servicios                                         |
| II-05 | II/20: Repository; Factory opcional                                                     | ProductRepository separa consultas, paginación y reserva atómica; servicio inyectable y pruebas sin Mongo                                  |
| II-06 | II/21: Ticket con código único, fecha, importe, comprador; permisos admin/user/chat     | Modelo y servicio de ticket; admin no compra ni usa chat. Handshake y mensajes revalidan sesión/rol                                        |
| II-07 | II/22: compra con stock suficiente, parcial y devolución de IDs no comprados            | Transacción Mongo conserva pendientes, descuenta comprados y confirma ticket/carrito; rollback, concurrencia y doble confirmación probados |

La práctica de negocios/usuarios/órdenes de la clase 15 es un ejercicio
paralelo. Su texto servicio–DAO no elimina el requisito Repository de la
tercera preentrega del ecommerce. Factory es opcional; el final usa Mongo.
Memoria y FileSystem se eligen en sus prácticas independientes.

## Tercer módulo y final

| ID     | Fuente y requisito                                                                                                                | Implementación y comprobación                                                                                                          |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| III-01 | Clase 32: mockingproducts con 100 productos, formato Mongo                                                                        | IDs ObjectId válidos, códigos únicos, esquema validado; endpoint sólo admin y sin persistencia                                         |
| III-02 | Clase 32: catálogo de errores habituales                                                                                          | Catálogo HTTP en services/errors; middleware común para validación, conflicto, disponibilidad y errores internos sin detalles privados |
| III-03 | Clase 34: debug/http/info/warning/error/fatal; consola dev, info prod; errors.log sólo error/fatal; loggerTest                    | Winston configurado por entorno; endpoint protegido responde tras emitir los seis niveles                                              |
| III-04 | Práctica 37: recuperación por correo, una hora, enlace de un uso, no repetir contraseña, renovar expirado                         | Token hasheado, consumo único y vistas; pruebas HTTP con buzón simulado                                                                |
| III-05 | Práctica 37: premium, owner por defecto admin, CRUD propio/admin, no comprar producto propio                                      | Políticas en rutas y compra, relectura del rol; pruebas de acceso y concurrencia                                                       |
| III-06 | Clase 39: Swagger de productos y carritos                                                                                         | /apidocs y /apidocs.json contrastados con rutas reales; se documenta current adicionalmente, no se exige toda la sesión                |
| III-07 | Clase 41, complementario: Mocha/Chai/Supertest, mínimo tres casos por router products/carts/sessions, no sólo códigos de estado   | npm run test:curso: tres casos por router y dos de modelo; base efímera, identidad propia y aserciones de datos persistidos            |
| III-08 | Práctica 44; comisión23/18: documents{name,reference}, last_connection en login/logout y router users                             | Modelo, servicios, rutas y pruebas de actividad                                                                                        |
| III-09 | Práctica44; comisión23/19–20, complementario: carga múltiple Multer; profiles/products/documents; tres comprobantes para promover | Almacenamiento privado y validado; identificación/domicilio/estado de cuenta; promoción condicionada y democión libre                  |
| F-01   | Manual III final, comisión24/43: GET usuarios mínimo, baja por inactividad de dos días con correo                                 | Administración, DTO mínimo y limpieza probados con usuarios ficticios; fallo de correo conserva la cuenta                              |
| F-02   | Final: interfaz de usuarios para cambiar rol/eliminar                                                                             | Vista /users protegida; no permite eliminar al admin conectado                                                                         |
| F-03   | Final, comisión24/44: borrar producto premium notifica a su dueño                                                                 | Buzón simulado acredita destinatario y aviso; correo real pendiente                                                                    |
| F-04   | Final: cerrar compra desde vistas                                                                                                 | Catálogo → carrito → confirmación → recibo; estados vacío, error, parcial y total; API y navegador comprobados                         |
| F-05   | Final, comisión24/45: despliegue obligatorio                                                                                      | Preparación en Dockerfile, healthz, host/puerto, volumen y guía; falta construir imagen y validar HTTPS/servicios reales               |
| F-06   | Rúbrica: aplicación ejecutable, MVC/capas, políticas de sesión e integridad de compra                                             | Demo local con Mongo efímero; pruebas de HTTP, WebSocket, compra y persistencia                                                        |

La pasarela de pagos **no se evalúa** en el final según manual III y
comisión24/45. No se agrega un proveedor de pagos ni un frontend distinto
como supuesto requisito. Las actividades complementarias figuran como tales,
aunque las políticas premium también aparecen en la rúbrica.

## Verificación y cierre

```sh
npm test
npm run check:secrets
npm audit
```

Las pruebas crean bases y archivos temporales, nunca usan MONGO_URL ni
credenciales históricas. El correo se inyecta como buzón en memoria.
Los tests del curso usan Mocha/Chai/Supertest; las regresiones de mantenimiento
usan node:test y cubren además rollback, concurrencia, documentos y chat.

Las mejoras de transacciones, redondeo monetario, archivos privados, escape
HTML, límite de mensajes y recuperación con token hasheado son decisiones
de mantenimiento, no citas textuales de las consignas.

El cierre local del código se distingue del cierre externo:
OAuth y SMTP requieren credenciales nuevas; el despliegue requiere HTTPS,
Mongo replica set y almacenamiento persistente. El historial contiene
credenciales expuestas que su titular debe revisar/revocar.
Ver [guía de despliegue](DESPLIEGUE.md). No hay aprobación docente ni
instalación pública certificada por estas pruebas.
