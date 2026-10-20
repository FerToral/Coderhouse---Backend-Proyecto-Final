# CityCode · Ecommerce Backend

Proyecto final de **Programación Backend de Coderhouse, comisión 43340 (2023)**. Servidor Node.js/Express con MongoDB, sesiones, políticas de acceso y vistas Handlebars. Conserva el desarrollo histórico del curso e incorpora mantenimiento de funcionamiento, seguridad y presentación.

## Qué se puede hacer

- Consultar productos con filtros, paginación y orden por precio.
- Crear una cuenta, iniciar/cerrar sesión y gestionar un carrito propio.
- Confirmar una compra total o parcial: ticket, descuento de existencias y carrito se confirman en una transacción.
- Consultar el comprobante desde la cuenta compradora.
- Administrar cuentas, promover usuarios con documentación completa y notificar bajas por inactividad.
- Restablecer una contraseña mediante un enlace de un solo uso válido por una hora.
- Gestionar productos según rol: administrador o premium propietario.

Es un ecommerce académico: **no procesa pagos reales**. La pasarela no forma parte de los requisitos evaluados del final. Ver [consigna y recorrido](docs/CONSIGNA_Y_ALCANCE.md).

## Requisitos

Node **24 recomendado** (también se admite 20.19+ o 22.12+) y npm. MongoDB debe estar configurado como **replica set** para las transacciones; un servidor standalone no alcanza. El arranque importa configuración y abre conexiones de forma explícita.

### Demo sin cuentas externas

```sh
npm ci
npm run demo
```

Abrir **http://127.0.0.1:8767/products** y crear una cuenta ficticia. La demo inicia Mongo temporal con cuatro productos de ejemplo; no consume `.env`, Mongo remoto ni correo. No requiere Atlas. La primera ejecución descarga el binario oficial de MongoDB 7.0.14 (en Windows, aproximadamente 592 MB); las siguientes reutilizan la caché. Al cerrar con Ctrl+C se descartan los datos de esta demo.

### Ejecución con base propia

1. Copiar `.env.example` como `.env.local` y completar `MONGO_URL`, `SESSION_SECRET` y `API_URL`.
2. Generar un secreto local aleatorio de al menos 32 caracteres; no reutilizar los del historial.
3. Ejecutar `npm start`; `npm run dev` activa el watch nativo de Node.
4. Configurar `NODE_ENV=production` sólo con HTTPS, proxy de confianza y sesiones Mongo persistentes.

OAuth GitHub y correo son opcionales para navegar/comprar; se habilitan con sus variables. Las funciones que envían correo devuelven un error si el transporte no está configurado. No se usan claves de demostración ni administradores con contraseña fija.

## Pruebas

```sh
npm test
npm audit
```

- `test/unit`: reglas del carrito y autorización sin base.
- `test/integration`: transacciones Mongo, concurrencia, API HTTP, sesiones, permisos, documentos y recuperación. Crean bases temporales propias y nunca leen `MONGO_URL`; el correo se sustituye por un buzón en memoria.
- `test/*.test.js`: prácticas históricas conservadas; no se incluyen automáticamente en la batería vigente. El test de usuario ya no abre una base externa ni elimina colecciones al importar.

La batería actual suma **51 pruebas**. En esta revisión se comprobó además el flujo real de navegador: registro → catálogo → cantidad → compra → recibo, con vista estrecha y escritorio. Las pruebas no equivalen a aprobación docente ni garantizan la seguridad de un despliegue externo.

## Estructura

```text
src/
  config/       configuración y estrategias de acceso
  routes/       endpoints API y vistas
  controllers/  entrada HTTP y respuestas
  services/     reglas de compra, cuentas y recuperación
  dao/          persistencia, modelos y transacciones
  middlewares/  autorización, validación y documentos
  views/        catálogo, carrito, recibo y administración
  public/       estilos y comportamiento de las vistas
test/           pruebas unitarias e integrales
scripts/        demo efímera
docs/           consigna, contratos y alcance
```

La documentación Swagger se consulta en `/apidocs`. Sus esquemas históricos aún necesitan reconciliarse completamente con las rutas actuales; los contratos activos y límites están en [la guía de API](docs/API.md).

## Seguridad y límites

Los archivos de entorno y logs no se versionan en la revisión actual. **El historial previo contiene credenciales expuestas**: retirarlas del código no las revoca. Su titular debe revisar/revocar las que sigan activas. No se reescribió la historia ni se verificó su vigencia.

Los documentos se guardan fuera de los recursos públicos, con nombres aleatorios, límites de tamaño y descarga autenticada. Nunca subir documentos personales reales a una demo pública. El correo real, OAuth, HTTPS/proxy y despliegue externo no fueron ejercitados: se probaron localmente con sustitutos.

Las actividades anteriores permanecen en el repositorio como contexto; la interfaz activa es el catálogo HTTP. Las escrituras de productos/carrito por sockets sin autorización fueron retiradas. El módulo histórico de chat todavía requiere una revisión específica antes de presentarse como funcionalidad completa.

## Autoría y material del curso

Desarrollo académico de Fernando Toralez sobre las actividades del curso. El mantenimiento posterior se distingue en Git; no se presenta como entrega original de 2023. Consignas y rúbricas docentes se enlazan desde `docs`, sin redistribuir copias cuyo permiso no esté acreditado.
