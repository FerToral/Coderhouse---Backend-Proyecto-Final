// Contrato activo. Los YAML anteriores se conservan como material histórico.
export const apiDocumentation = {
  openapi: "3.0.3",
  info: {
    title: "CityCode · API de productos y carritos",
    version: "1.1.0",
    description:
      "Proyecto académico Coderhouse 43340. Sesión HttpOnly mediante POST /register o /login; no bearer ficticio. Otras rutas se describen en docs/API.md.",
  },
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "connect.sid",
        description:
          "Cookie firmada de express-session. Ingresar por /login; el navegador la envía automáticamente.",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          status: {
            type: "string",
          },
          msg: {
            type: "string",
          },
          data: {
            type: "string",
          },
        },
      },
      Product: {
        type: "object",
        properties: {
          _id: {
            type: "string",
          },
          title: {
            type: "string",
          },
          description: {
            type: "string",
          },
          code: {
            type: "string",
          },
          price: {
            type: "number",
            minimum: 0,
          },
          stock: {
            type: "integer",
            minimum: 0,
          },
          category: {
            type: "string",
          },
          status: {
            type: "boolean",
            default: true,
          },
          thumbnails: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
      },
      ProductInput: {
        type: "object",
        required: [
          "title",
          "description",
          "code",
          "price",
          "stock",
          "category",
        ],
        properties: {
          title: {
            type: "string",
          },
          description: {
            type: "string",
          },
          code: {
            type: "string",
          },
          price: {
            type: "number",
            minimum: 0,
          },
          stock: {
            type: "integer",
            minimum: 0,
          },
          category: {
            type: "string",
          },
          status: {
            type: "boolean",
            default: true,
          },
          thumbnails: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
      },
      ProductUpdate: {
        type: "object",
        properties: {
          title: {
            type: "string",
          },
          description: {
            type: "string",
          },
          code: {
            type: "string",
          },
          price: {
            type: "number",
            minimum: 0,
          },
          stock: {
            type: "integer",
            minimum: 0,
          },
          category: {
            type: "string",
          },
          status: {
            type: "boolean",
            default: true,
          },
          thumbnails: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
        description:
          "Campos directos; también se conserva el envoltorio histórico campo. El propietario no es editable.",
      },
      CartEntry: {
        type: "object",
        required: ["product", "quantity"],
        properties: {
          product: {
            type: "string",
          },
          quantity: {
            type: "integer",
            minimum: 1,
          },
        },
      },
      Cart: {
        type: "object",
        properties: {
          _id: {
            type: "string",
          },
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product: {
                  oneOf: [
                    {
                      type: "string",
                    },
                    {
                      $ref: "#/components/schemas/Product",
                    },
                  ],
                },
                quantity: {
                  type: "integer",
                  minimum: 1,
                },
              },
            },
          },
        },
      },
      Ticket: {
        type: "object",
        nullable: true,
        properties: {
          _id: {
            type: "string",
          },
          code: {
            type: "string",
          },
          purchase_datetime: {
            type: "string",
            format: "date-time",
          },
          amount: {
            type: "number",
            minimum: 0,
          },
          purchaser: {
            type: "string",
            format: "email",
          },
        },
      },
      PurchaseResult: {
        type: "object",
        properties: {
          status: {
            type: "string",
          },
          ticket: {
            $ref: "#/components/schemas/Ticket",
          },
          productsNotPurchased: {
            type: "array",
            items: {
              type: "string",
            },
          },
          msg: {
            type: "string",
          },
        },
      },
    },
  },
  paths: {
    "/api/products": {
      get: {
        summary: "Listar productos públicos",
        responses: {
          200: {
            description: "Operación realizada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                    },
                    payload: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Product",
                      },
                    },
                    totalPages: {
                      type: "integer",
                    },
                    page: {
                      type: "integer",
                    },
                    prevPage: {
                      type: "integer",
                      nullable: true,
                    },
                    nextPage: {
                      type: "integer",
                      nullable: true,
                    },
                    hasPrevPage: {
                      type: "boolean",
                    },
                    hasNextPage: {
                      type: "boolean",
                    },
                    prevLink: {
                      type: "string",
                      nullable: true,
                    },
                    nextLink: {
                      type: "string",
                      nullable: true,
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          401: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          403: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          404: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          500: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 10,
            },
          },
          {
            name: "page",
            in: "query",
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100000,
              default: 1,
            },
          },
          {
            name: "sort",
            in: "query",
            schema: {
              type: "string",
              enum: ["asc", "desc"],
            },
            description: "Orden por precio",
          },
          {
            name: "query",
            in: "query",
            schema: {
              type: "string",
            },
            description: "Categoría exacta, o true/false para disponibilidad",
          },
        ],
      },
      post: {
        summary: "Crear producto (admin/premium)",
        responses: {
          201: {
            description: "Creado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                    },
                    payload: {
                      $ref: "#/components/schemas/Product",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          401: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          403: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          409: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
        security: [
          {
            sessionCookie: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ProductInput",
              },
            },
          },
        },
      },
    },
    "/api/products/{pid}": {
      parameters: [
        {
          name: "pid",
          in: "path",
          required: true,
          schema: {
            type: "string",
            pattern: "^[a-fA-F0-9]{24}$",
          },
        },
      ],
      get: {
        summary: "Obtener producto público",
        responses: {
          200: {
            description: "Operación realizada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                    },
                    payload: {
                      $ref: "#/components/schemas/Product",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          401: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          403: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          404: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          500: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },
      put: {
        summary: "Actualizar producto (admin o premium dueño)",
        responses: {
          200: {
            description: "Operación realizada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                    },
                    payload: {
                      $ref: "#/components/schemas/Product",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          401: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          403: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          404: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          500: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
        security: [
          {
            sessionCookie: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ProductUpdate",
              },
            },
          },
        },
      },
      delete: {
        summary: "Eliminar producto y notificar a dueño premium",
        responses: {
          200: {
            description: "Operación realizada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                    },
                    msg: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          401: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          403: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          404: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          500: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
        security: [
          {
            sessionCookie: [],
          },
        ],
      },
    },
    "/api/carts": {
      post: {
        summary: "Obtener carrito propio o crearlo si no existe",
        responses: {
          200: {
            description: "Ya existía",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                    },
                    data: {
                      $ref: "#/components/schemas/Cart",
                    },
                  },
                },
              },
            },
          },
          201: {
            description: "Creado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                    },
                    data: {
                      $ref: "#/components/schemas/Cart",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          401: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          403: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
        security: [
          {
            sessionCookie: [],
          },
        ],
      },
    },
    "/api/carts/{cid}": {
      parameters: [
        {
          name: "cid",
          in: "path",
          required: true,
          schema: {
            type: "string",
            pattern: "^[a-fA-F0-9]{24}$",
          },
        },
      ],
      get: {
        summary: "Obtener carrito propio con productos poblados",
        responses: {
          200: {
            description: "Operación realizada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                    },
                    data: {
                      $ref: "#/components/schemas/Cart",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          401: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          403: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          404: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          500: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
        security: [
          {
            sessionCookie: [],
          },
        ],
      },
      put: {
        summary: "Reemplazar productos del carrito propio",
        responses: {
          200: {
            description: "Operación realizada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                    },
                    data: {
                      $ref: "#/components/schemas/Cart",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          401: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          403: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          404: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          500: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
        security: [
          {
            sessionCookie: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/CartEntry",
                },
              },
            },
          },
        },
        description:
          "Array directo, no objeto products; sin productos duplicados.",
      },
      delete: {
        summary: "Vaciar carrito propio",
        responses: {
          200: {
            description: "Operación realizada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                    },
                    data: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          401: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          403: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          404: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          500: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
        security: [
          {
            sessionCookie: [],
          },
        ],
      },
    },
    "/api/carts/{cid}/products/{pid}": {
      parameters: [
        {
          name: "cid",
          in: "path",
          required: true,
          schema: {
            type: "string",
            pattern: "^[a-fA-F0-9]{24}$",
          },
        },
        {
          name: "pid",
          in: "path",
          required: true,
          schema: {
            type: "string",
            pattern: "^[a-fA-F0-9]{24}$",
          },
        },
      ],
      post: {
        summary: "Agregar una unidad",
        responses: {
          201: {
            description: "Unidad agregada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                    },
                    data: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          401: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          403: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          404: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
        security: [
          {
            sessionCookie: [],
          },
        ],
      },
      put: {
        summary: "Cambiar cantidad del producto",
        responses: {
          200: {
            description: "Operación realizada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                    },
                    data: {
                      $ref: "#/components/schemas/Cart",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          401: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          403: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          404: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          500: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
        security: [
          {
            sessionCookie: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["quantity"],
                properties: {
                  quantity: {
                    type: "integer",
                    minimum: 1,
                  },
                },
              },
            },
          },
        },
        description: "stock se conserva como alias histórico de quantity.",
      },
      delete: {
        summary: "Quitar producto del carrito",
        responses: {
          200: {
            description: "Operación realizada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: {
                      type: "string",
                    },
                    data: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
          400: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          401: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          403: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          404: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          500: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
        security: [
          {
            sessionCookie: [],
          },
        ],
      },
    },
    "/api/carts/{cid}/purchase": {
      parameters: [
        {
          name: "cid",
          in: "path",
          required: true,
          schema: {
            type: "string",
            pattern: "^[a-fA-F0-9]{24}$",
          },
        },
      ],
      post: {
        summary: "Finalizar compra del carrito propio",
        responses: {
          200: {
            description: "Sin productos comprados",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PurchaseResult",
                },
              },
            },
          },
          201: {
            description: "Ticket generado",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PurchaseResult",
                },
              },
            },
          },
          400: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          401: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          403: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          404: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          409: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          503: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
        security: [
          {
            sessionCookie: [],
          },
        ],
        description:
          "Transacción Mongo. Compra parcial: conserva productos no comprados. 201 con ticket, 200 sin compra. Admin y premium dueño del producto no pueden comprar.",
      },
      put: {
        summary: "Compra: alias PUT histórico",
        responses: {
          200: {
            description: "Sin productos comprados",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PurchaseResult",
                },
              },
            },
          },
          201: {
            description: "Ticket generado",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PurchaseResult",
                },
              },
            },
          },
          400: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          401: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          403: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          404: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          409: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          503: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
        security: [
          {
            sessionCookie: [],
          },
        ],
        description:
          "Transacción Mongo. Compra parcial: conserva productos no comprados. 201 con ticket, 200 sin compra. Admin y premium dueño del producto no pueden comprar.",
      },
    },
    "/api/sessions/current": {
      get: {
        summary: "Identidad mínima del usuario autenticado",
        responses: {
          200: {
            description: "Operación realizada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  description: "DTO sin password ni documentos privados.",
                },
              },
            },
          },
          400: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          401: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          403: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          404: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
          500: {
            description: "Error de validación, sesión, permisos o recurso",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
        security: [
          {
            sessionCookie: [],
          },
        ],
      },
    },
  },
};
