# Plan de implementación: módulo de productos

Este documento describe el plan para incorporar el CRUD de productos al backend
del MVP. Es la primera iteración del módulo: la API queda funcional con datos en
memoria y las relaciones con categorías y etiquetas se validan contra
repositorios sembrados, pero la administración de categorías y etiquetas queda
para el módulo siguiente.

## 1. Alcance

Incluido en esta iteración:

- Alta de productos.
- Listado y consulta de productos.
- Modificación parcial de productos.
- Baja lógica mediante `isActive` (`DELETE` no elimina el registro).
- Filtros por búsqueda, categoría, etiqueta, estado y stock bajo.
- Paginación del listado.
- Validación de categoría y etiquetas contra los catálogos existentes.
- Protección de las rutas con JWT y autorización por rol.
- Datos de demostración en memoria para probar la API sin PostgreSQL.

Fuera de alcance en esta iteración:

- CRUD de categorías y etiquetas (se implementa en el módulo siguiente).
- Movimientos de stock e historial de precios.
- Conexión de productos, categorías y etiquetas a PostgreSQL.
- Carga de imágenes, SKU o código de barras.
- Integración de la pantalla **Products** del cliente con la API.

## 2. Decisiones técnicas

### Persistencia inicial en memoria

PostgreSQL ya está conectado para los usuarios, pero los productos, las
categorías y las etiquetas todavía se guardan en repositorios en memoria que
replican las columnas del modelo relacional. Así el módulo de productos puede
seguir avanzando sin bloquearse por la migración de sus tablas.

La separación se mantiene según la arquitectura de tres capas:

- `repositories/` contiene los arreglos y la búsqueda de datos.
- `services/` aplica las reglas de negocio.
- `controllers/` y `routes/` exponen la API HTTP.

Cuando se migren sus tablas, solo se reemplazan los repositorios.

### Categorías y etiquetas

El modelo relacional exige `products.category_id` y la tabla intermedia
`product_tags`. Como su CRUD todavía no existe, esta iteración agrega dos
repositorios de solo lectura con datos sembrados:

- `categoryRepository`: categorías activas para validar `categoryId`.
- `tagRepository`: etiquetas activas para validar `tagIds`.

Los servicios de productos consultan esos repositorios para validar
referencias y para devolver el nombre de la categoría y los datos de las
etiquetas en cada respuesta. Los endpoints de categorías y etiquetas se
incorporan en el módulo siguiente sin cambiar el contrato de productos.

### Baja lógica

La baja de un producto actualiza `is_active` a `false`; el registro se conserva
para no romper ventas históricas. Un producto inactivo:

- No aparece en el listado por defecto.
- Puede consultarse por ID.
- Puede reactivarse con `PATCH` enviando `isActive: true`.
- Puede seguir modificándose para corregir sus datos.

### Actualización parcial

La modificación usa `PATCH /api/products/:id`: el cliente envía solo los campos
que quiere cambiar. Un cuerpo vacío se rechaza con `400 VALIDATION_ERROR`.

### Dinero y cantidades

En memoria, `price` y `cost` son números con hasta dos decimales, en
correspondencia con `decimal(10,2)` del modelo relacional. Las cantidades
(`stock`, `minStock`) son enteros no negativos.

### Paginación y orden

- `page`: entero positivo, por defecto `1`.
- `limit`: entero entre `1` y `100`, por defecto `20`.
- El listado se ordena por nombre de forma ascendente e insensible a mayúsculas.
- `totalPages` es `0` cuando no hay resultados.

### Roles

| Operación                    | Rol requerido    |
| ---------------------------- | ---------------- |
| Listar y consultar productos | Autenticado      |
| Crear, modificar y dar baja  | `admin`          |

Los empleados pueden consultar el catálogo, pero no administrarlo. La decisión
puede ampliarse cuando se definan permisos más finos.

## 3. Estructura del backend

```text
apps/api/src/
├── controllers/
│   └── product.controller.ts
├── repositories/
│   ├── category.repository.ts
│   ├── product.repository.ts
│   └── tag.repository.ts
├── routes/
│   └── product.routes.ts
├── services/
│   └── product.service.ts
├── types/
│   ├── category.types.ts
│   ├── product.types.ts
│   └── tag.types.ts
└── validators/
    └── product.validator.ts
```

`app.ts` monta el router en `/api/products`. El validador se ocupa de la forma
de los datos de entrada; el servicio aplica las reglas de negocio y el
repositorio resuelve el acceso a los datos.

## 4. Modelo de datos en memoria

### Producto

| Campo         | Tipo             | Regla                                      |
| ------------- | ---------------- | ------------------------------------------ |
| `id`          | entero           | Autoincremental                            |
| `categoryId`  | entero           | Obligatorio; debe existir y estar activo   |
| `name`        | texto            | Obligatorio, 1 a 150 caracteres            |
| `description` | texto o `null`   | Opcional, hasta 2000 caracteres            |
| `price`       | número           | Obligatorio, mayor o igual a 0, 2 decimales|
| `cost`        | número           | Obligatorio, mayor o igual a 0, 2 decimales|
| `stock`       | entero           | Por defecto `0`, no negativo               |
| `minStock`    | entero           | Por defecto `0`, no negativo               |
| `isActive`    | booleano         | Por defecto `true`                         |
| `tagIds`      | arreglo de enteros | Etiquetas existentes y activas, sin repetir |
| `createdAt`   | ISO 8601         | Se asigna al crear                         |
| `updatedAt`   | ISO 8601         | Se actualiza en cada modificación          |

La respuesta agrega datos derivados para el cliente:

- `category`: `{ id, name }` o `null` si la categoría ya no existe.
- `tags`: arreglo de `{ id, name, color }`.
- `lowStock`: `true` cuando `stock <= minStock`.

### Datos sembrados

Categorías: Almacén, Bebidas, Limpieza y Electrónica.

Etiquetas: Oferta, Novedad y Sin TACC.

Productos de demostración:

| Producto                     | Categoría   | Stock | Stock mínimo | Etiquetas |
| ---------------------------- | ----------- | ----- | ------------ | --------- |
| Yerba mate compuesta 1 kg    | Almacén     | 40    | 10           | Oferta    |
| Gaseosa cola 2.25 L          | Bebidas     | 24    | 6            | Novedad   |
| Detergente 750 ml            | Limpieza    | 5     | 8            | Oferta    |
| Auriculares inalámbricos     | Electrónica | 12    | 3            | Novedad   |

El detergente queda con stock bajo para probar el filtro `lowStock`.

## 5. Endpoints

Todas las rutas requieren `Authorization: Bearer <token>`.

| Método   | Ruta                  | Acceso      | Descripción                                   |
| -------- | --------------------- | ----------- | --------------------------------------------- |
| `GET`    | `/api/products`       | Autenticado | Lista productos con filtros y paginación      |
| `GET`    | `/api/products/:id`   | Autenticado | Devuelve un producto                          |
| `POST`   | `/api/products`       | `admin`     | Crea un producto                              |
| `PATCH`  | `/api/products/:id`   | `admin`     | Modifica parcialmente un producto             |
| `DELETE` | `/api/products/:id`   | `admin`     | Da de baja lógica un producto                 |

### Parámetros del listado

| Parámetro    | Valores                          | Descripción                                      |
| ------------ | -------------------------------- | ------------------------------------------------ |
| `search`     | texto                            | Coincidencia parcial sobre el nombre             |
| `categoryId` | entero positivo                  | Filtra por categoría                             |
| `tagId`      | entero positivo                  | Filtra por etiqueta                              |
| `isActive`   | `true`, `false` o `all`          | Por defecto `true`                               |
| `lowStock`   | `true` o `false`                 | Por defecto `false`; usa `stock <= minStock`     |
| `page`       | entero positivo                  | Por defecto `1`                                  |
| `limit`      | entero entre 1 y 100             | Por defecto `20`                                 |

## 6. Contratos

### Producto

```json
{
  "id": 1,
  "categoryId": 1,
  "category": { "id": 1, "name": "Almacén" },
  "name": "Yerba mate compuesta 1 kg",
  "description": "Yerba mate con hierbas serranas.",
  "price": 4500,
  "cost": 3200,
  "stock": 40,
  "minStock": 10,
  "lowStock": false,
  "isActive": true,
  "tags": [{ "id": 1, "name": "Oferta", "color": "#F97316" }],
  "createdAt": "2026-01-15T12:00:00.000Z",
  "updatedAt": "2026-01-15T12:00:00.000Z"
}
```

### Listado

```json
{
  "products": [{ "...": "producto" }],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 4,
    "totalPages": 1
  }
}
```

### Creación

```json
// POST /api/products
{
  "categoryId": 2,
  "name": "Agua mineral 500 ml",
  "description": "Botella sin gas.",
  "price": 1200,
  "cost": 700,
  "stock": 30,
  "minStock": 10,
  "tagIds": [2]
}
```

Respuesta: `201 Created` con `{ "product": { ... } }`.

### Modificación

```json
// PATCH /api/products/5
{
  "price": 1350,
  "stock": 25,
  "isActive": true
}
```

Respuesta: `200 OK` con `{ "product": { ... } }`.

### Baja lógica

```json
// DELETE /api/products/5
{ "product": { "isActive": false, "...": "resto del producto" } }
```

La operación es idempotente: repetir la baja devuelve el producto ya inactivo.

### Errores

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "El precio debe ser un número mayor o igual a 0." } }
```

| Situación                                      | Estado | Código              |
| ---------------------------------------------- | ------ | ------------------- |
| Cuerpo o parámetros inválidos                  | `400`  | `VALIDATION_ERROR`  |
| Categoría inexistente o inactiva               | `400`  | `INVALID_CATEGORY`  |
| Etiqueta inexistente o inactiva                | `400`  | `INVALID_TAG`       |
| Producto inexistente                           | `404`  | `PRODUCT_NOT_FOUND` |
| Token ausente, inválido o expirado             | `401`  | `UNAUTHORIZED`      |
| Usuario sin rol `admin` en una mutación        | `403`  | `FORBIDDEN`         |

## 7. Reglas de validación

- `name`: obligatorio, se recorta, no puede quedar vacío y admite hasta 150
  caracteres.
- `description`: opcional; `null` o cadena vacía se normalizan a `null`; admite
  hasta 2000 caracteres.
- `categoryId`: entero positivo; debe existir y estar activo.
- `price` y `cost`: números finitos, mayores o iguales a 0, con hasta dos
  decimales y un máximo de `99.999.999,99`.
- `stock` y `minStock`: enteros mayores o iguales a 0.
- `tagIds`: arreglo de enteros positivos, sin duplicados; cada etiqueta debe
  existir y estar activa.
- `isActive`: booleano.
- En `PATCH`, al menos un campo conocido debe estar presente.
- Los campos desconocidos se ignoran.
- La búsqueda no distingue mayúsculas ni minúsculas y se aplica solo al nombre.

## 8. Pasos y commits

Cada paso es un commit atómico y deja el backend compilando.

1. `docs: define branch and commit conventions`
2. `docs: add products module implementation plan`
3. `feat(api): add category and tag stores for product relations`
4. `feat(api): add product repository with seeded catalog`
5. `feat(api): add product input validators`
6. `feat(api): add product service with CRUD rules`
7. `feat(api): expose authenticated product CRUD endpoints`
8. `docs(api): document products module endpoints and status`

## 9. Verificación

Comandos:

```bash
npx tsc --noEmit -p apps/api/tsconfig.json
```

Pruebas manuales con la API levantada:

1. `POST /api/auth/login` con `admin` / `admin` para obtener el token.
2. `GET /api/products` sin token devuelve `401 UNAUTHORIZED`.
3. `GET /api/products` con token devuelve los cuatro productos sembrados.
4. `GET /api/products?lowStock=true` devuelve solo el detergente.
5. `POST /api/products` crea un producto y devuelve `201`.
6. `POST /api/products` con `categoryId` inexistente devuelve
   `400 INVALID_CATEGORY`.
7. `PATCH /api/products/:id` modifica solo los campos enviados.
8. `PATCH /api/products/:id` con cuerpo vacío devuelve `400 VALIDATION_ERROR`.
9. `DELETE /api/products/:id` marca el producto como inactivo y el listado
   por defecto deja de mostrarlo.
10. `GET /api/products?isActive=all` incluye el producto dado de baja.

## 10. Trabajo futuro

- Reemplazar los repositorios en memoria de productos, categorías y etiquetas por consultas a PostgreSQL.
- Implementar el CRUD de categorías y etiquetas.
- Incorporar movimientos de stock e historial de precios.
- Agregar SKU, código de barras e imágenes.
- Integrar la pantalla **Products** del cliente con estos endpoints.
- Evaluar permisos de edición de stock para el rol `employee`.

## 11. Estado de implementación

La primera iteración del backend quedó implementada y verificada en la rama
`feat/api-products-crud`:

- [x] Repositorios en memoria de categorías, etiquetas y productos.
- [x] Validadores de entrada.
- [x] Servicio con las reglas de negocio y baja lógica.
- [x] Endpoints protegidos con JWT y autorización `admin` para mutaciones.
- [x] Verificación con `npx tsc --noEmit` y pruebas manuales de los casos del
  apartado 9.

La integración de la pantalla **Products** del cliente con estos endpoints se
completó en una iteración posterior, documentada en
[Plan de integración del frontend de productos](06-plan-productos-frontend.md).

La integración con PostgreSQL y el CRUD de categorías y etiquetas siguen
pendientes.
