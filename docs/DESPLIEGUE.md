# Desplegar CityCode

El final solicita una aplicación accesible con el flujo de compra completo.
El código y la demo local no reemplazan esa verificación.

## Primera cuenta administradora

Registrar una cuenta propia desde la aplicación y, en el entorno del
servidor, definir ADMIN_EMAIL con su correo y ejecutar
`npm run admin:promover`. En el contenedor puede ejecutarse
`node scripts/promote-admin.js`. Es una operación explícita: no crea
contraseñas fijas ni promueve cuentas durante el arranque.
Retirar ADMIN_EMAIL del entorno una vez utilizada.

## Configuración necesaria

- MongoDB replica set, con usuario propio de permisos acotados y URI nueva.
- Secreto de sesión aleatorio de al menos 32 caracteres.
- Dominio HTTPS y API_URL con ese origen para el retorno OAuth.
- Disco persistente para UPLOAD_ROOT y retención de logs. No guardar documentos bajo src/public.
- Correo para recuperación, bajas por inactividad y aviso a vendedores.
- Aplicación OAuth GitHub para habilitar ese inicio de sesión.

No publicar .env ni usar claves del historial. Las claves expuestas anteriormente
deben ser revocadas por su titular antes de exponer una instalación real.

HOST es 127.0.0.1 en desarrollo y 0.0.0.0 en producción.
PORT lo puede inyectar el proveedor. TRUST_PROXY=0 es el valor seguro sin
proxy. Usar TRUST_PROXY=1 sólo cuando existe **un único salto de proxy**
que sobreescribe X-Forwarded-\* y no hay acceso público directo al proceso.
La cookie de producción requiere HTTPS; no se desactiva para simular un despliegue.

## Contenedor

```sh
docker build -t citycode-backend .
docker run --rm --name citycode -p 127.0.0.1:8080:8080 --env-file .env.production --mount source=citycode-runtime,target=/app/runtime citycode-backend
```

El servidor se ejecuta como usuario node, sin herramientas de desarrollo.
La imagen sólo copia src, el comando administrativo y los manifiestos npm; no copia Git, pruebas,
credenciales, documentos subidos ni archivos históricos.
El volumen conserva runtime/uploads y runtime/logs. Ubicar un proxy HTTPS
delante; el comando anterior sólo publica en loopback.

GET /healthz devuelve 200 si la conexión Mongo está disponible y 503 en caso
contrario. No informa URI, identidades ni configuración. Las conexiones
Socket.IO se cierran al recibir SIGTERM, antes de cerrar Mongo.

## Verificación de una instalación

1. Revisar que Git no contenga nuevos secretos y que los antiguos estén revocados.
2. Construir la imagen y comprobar el usuario no privilegiado y el volumen.
3. Confirmar HTTPS, cookies Secure/HttpOnly/SameSite y rechazo de orígenes ajenos.
4. Registrar usuario ficticio; login, filtros, carrito, compra total/parcial y comprobante.
5. Probar correo de recuperación de un uso y OAuth con cuentas de prueba.
6. Revisar roles, carga/descarga privada, notificaciones y administración con datos ficticios.
7. Reiniciar para verificar sesiones/documentos persistentes y consultar healthz.

**Estado:** preparado para despliegue; imagen todavía no construida en esta
revisión porque el daemon Docker no estaba activo. No hay URL pública
validada ni se configuraron servicios con las credenciales antiguas.

Referencias de operación: [Docker y Node](https://docs.docker.com/guides/nodejs/)
y [Express detrás de proxies](https://expressjs.com/en/guide/behind-proxies/).
