# Productos, archivos y primeras entregas

Primer tramo de Programación Backend, comisión 43340. Construye un catálogo
desde una clase en memoria hasta una API Express con persistencia JSON,
carritos y vistas Handlebars actualizadas por Socket.IO.

## Actividades

| Etapa              | Consigna                                                       | Implementación                                                                       |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Clase 2, manual I  | ProductManager, campos obligatorios, code único, ID y consulta | ProductManager sin ruta: memoria; firma posicional original de seis campos           |
| Clase 4            | CRUD asíncrono y ruta del archivo en el constructor            | ProductManager(ruta); propiedad path, lectura/escritura esperadas antes de responder |
| Clase 6            | GET productos, limit y búsqueda por ID                         | GET /api/products y /api/products/:pid                                               |
| Primera preentrega | Routers productos/carritos; cantidad acumulada y referencias   | CRUD productos, POST/GET carrito, POST /api/carts/:cid/product/:pid                  |
| Clase 10           | Handlebars y actualización en tiempo real al crear/borrar      | / y /realtimeproducts; la API HTTP emite el listado a los clientes conectados        |

La firma inicial es
`addProduct(title, description, price, thumbnail, code, stock)`.
La etapa HTTP usa un objeto con title, description, price, code, stock,
category, thumbnails y status (por defecto true). No recibe IDs del cliente.
Precio y stock cero son válidos; stock debe ser entero.

## Ejecutar

Desde la raíz del repositorio:

```sh
npm ci
npm run practica:memoria
# O, para conservar datos entre ejecuciones:
npm run practica:archivos
```

Abrir http://127.0.0.1:8081/realtimeproducts. El formulario permite altas y
bajas; el listado se actualiza en otras pestañas sin recargarlas.
Los archivos se crean en data/, excluido de Git. Cada archivo contiene
`{lastId, items}`: el contador evita reutilizar IDs borrados tras reiniciar.

La cola y el reemplazo por archivo temporal previenen pérdidas entre
operaciones de **una instancia y un proceso**. No ejecutar dos servidores
contra los mismos JSON. Un archivo corrupto produce error y no se
sobrescribe automáticamente.

Esta API reproduce la etapa previa a autenticación y sólo escucha en
loopback: no desplegarla como tienda pública. El ecommerce de la raíz usa
Mongo, sesiones y transacciones; sus permisos no se sustituyen por esta práctica.

## Desarrollo y aprendizaje

Se contrastaron los ProductManager y CartManager personales de los desafíos
de clases 2 y 8: inicio asíncrono sin esperar, modificación de una propiedad
distinta, validaciones que rechazaban cero y errores que devolvían funciones.
Esta versión conserva el ejercicio y corrige esos problemas, con pruebas
en test/unit/archivos.test.js. Los originales históricos permanecen en el
respaldo privado; no se importan bases ni datos personales de aquellas copias.

Consignas y fuentes: [recorrido del curso](../../docs/CONSIGNA_Y_ALCANCE.md).
