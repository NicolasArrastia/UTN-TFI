# Plan de implementación: etiquetas y categorías

Este documento describe el CRUD de etiquetas (tags) y categorías del MVP, tanto
en la API como en el cliente, y la corrección de la edición de productos cuando
una categoría o etiqueta asignada fue dada de baja.

## 1. Alcance

Incluido:

- Alta, listado, consulta, modificación y baja lógica de etiquetas y categorías.
- Reactivación con `PATCH` enviando `isActive: true`.
- Nombre único sin distinguir mayúsculas, minúsculas ni espacios extremos.
- Etiquetas con color hexadecimal `#RRGGBB` normalizado a mayúsculas.
- Categorías con `description` opcional (se guarda como `null` si queda vacía).
- Restricción de escritura exclusiva para el rol `admin`; los empleados solo
  pueden leer el catálogo.
- Secciones **Etiquetas** y **Categorías** dentro de **Settings** en el cliente,
  visibles solo para administradores.
- Conteo de productos activos por categoría para avisar antes de darla de baja.
- Sincronización del catálogo que usan los formularios de productos.
- Edición de productos que conservan categorías y etiquetas inactivas ya
  asignadas.

Fuera de alcance:

- Conexión de etiquetas y categorías a PostgreSQL.
- Permisos más finos que `admin` / `employee`.

## 2. Decisiones

### Persistencia en memoria

Los repositorios de etiquetas y categorías siguen en memoria aunque PostgreSQL ya
esté conectado para los usuarios. Replican las columnas de sus tablas y agregan
`create`, `update` y `softDelete`, además de las lecturas que ya usaba el módulo
de productos (`findById` y `findActiveById`).

### Baja lógica

`DELETE /api/tags/:id` y `DELETE /api/categories/:id` actualizan `is_active` a
`false`; el registro no se elimina. La operación es idempotente: repetir la baja
devuelve el registro ya inactivo. Un registro inactivo:

- No aparece en el listado por defecto.
- Puede consultarse por ID.
- Puede reactivarse con `PATCH` enviando `isActive: true`.
- No puede asignarse a productos nuevos ni agregarse a productos existentes.

En categorías la baja se permite aunque tenga productos activos. Es una baja
lógica: los productos conservan la categoría y dejan de poder asignarla a nuevos
productos. Para advertirlo, las respuestas para `admin` incluyen
`activeProductCount` con la cantidad de productos activos que la usan.

### Listado con inactivas

`GET /api/tags?includeInactive=true` y
`GET /api/categories?includeInactive=true` incluyen los registros inactivos
únicamente si el usuario autenticado es `admin`. Para un `employee` el parámetro
se ignora y la respuesta solo contiene activos (no se devuelve `403`). La
decisión prioriza que el catálogo de productos del empleado siga funcionando sin
errores mientras la restricción de escritura se valida en el backend.

### Coherencia con productos

El alta de productos valida con `findActiveById` cada categoría y etiqueta: todas
deben existir y estar activas.

La edición aplica una regla más flexible:

- La categoría se valida como activa solo si es distinta a la que ya tiene el
  producto.
- Las etiquetas se validan como activas solo si son nuevas. Las que el producto
  ya tenía deben seguir existiendo, pero pueden estar inactivas.

Así, dar de baja una categoría o etiqueta no bloquea la edición de los productos
que ya la usaban (por ejemplo, para cambiar el precio). Intentar agregar una
categoría o etiqueta inactiva sigue devolviendo `400 INVALID_CATEGORY` o
`400 INVALID_TAG`.

### Normalización de nombres y colores

- `name` se recorta y se compara sin distinguir mayúsculas/minúsculas ni
  espacios extremos.
- En etiquetas, `color` debe cumplir `#RRGGBB` y se guarda en mayúsculas.
- En categorías, `description` se recorta; un texto vacío se guarda como `null`.

## 3. Modelo de datos en memoria

### Etiquetas

| Campo       | Tipo       | Regla                                        |
| ----------- | ---------- | -------------------------------------------- |
| `id`        | entero     | Autoincremental                              |
| `name`      | texto      | Obligatorio, recortado, 1 a 50 caracteres    |
| `color`     | texto      | Obligatorio, `#RRGGBB`, normalizado a mayúsculas |
| `isActive`  | booleano   | `true` al crear; la baja lógica lo pasa a `false` |
| `createdAt` | ISO 8601   | Se asigna al crear                           |
| `updatedAt` | ISO 8601   | Se actualiza en cada modificación            |

Datos sembrados: Oferta (`#F97316`), Novedad (`#22C55E`) y Sin TACC
(`#0EA5E9`).

### Categorías

| Campo               | Tipo       | Regla                                             |
| ------------------- | ---------- | ------------------------------------------------- |
| `id`                | entero     | Autoincremental                                   |
| `name`              | texto      | Obligatorio, recortado, 1 a 100 caracteres        |
| `description`       | texto/null | Opcional, recortado, hasta 500 caracteres          |
| `isActive`          | booleano   | `true` al crear; la baja lógica lo pasa a `false`  |
| `createdAt`         | ISO 8601   | Se asigna al crear                                |
| `updatedAt`         | ISO 8601   | Se actualiza en cada modificación                 |
| `activeProductCount`| entero     | Solo en respuestas para `admin`; no se persiste    |

Datos sembrados: Almacén, Bebidas, Limpieza y Electrónica.

## 4. Endpoints

Todas las rutas requieren `Authorization: Bearer <token>`.

### Etiquetas

| Método   | Ruta               | Acceso      | Descripción                                      |
| -------- | ------------------ | ----------- | ------------------------------------------------ |
| `GET`    | `/api/tags`        | Autenticado | Lista etiquetas activas; admite `includeInactive` |
| `GET`    | `/api/tags/:id`    | Autenticado | Devuelve una etiqueta, activa o inactiva          |
| `POST`   | `/api/tags`        | `admin`     | Crea una etiqueta                                 |
| `PATCH`  | `/api/tags/:id`    | `admin`     | Modifica parcialmente o reactiva                  |
| `DELETE` | `/api/tags/:id`    | `admin`     | Da de baja lógica                                 |

### Categorías

| Método   | Ruta                  | Acceso      | Descripción                                          |
| -------- | --------------------- | ----------- | ---------------------------------------------------- |
| `GET`    | `/api/categories`     | Autenticado | Lista categorías activas; admite `includeInactive`    |
| `GET`    | `/api/categories/:id` | Autenticado | Devuelve una categoría, activa o inactiva             |
| `POST`   | `/api/categories`     | `admin`     | Crea una categoría                                   |
| `PATCH`  | `/api/categories/:id` | `admin`     | Modifica parcialmente o reactiva                     |
| `DELETE` | `/api/categories/:id` | `admin`     | Da de baja lógica (permitida aunque tenga productos) |

### Parámetro del listado

| Parámetro        | Valores          | Descripción                                              |
| ---------------- | ---------------- | -------------------------------------------------------- |
| `includeInactive`| `true` o `false` | Por defecto `false`; solo se aplica al rol `admin`       |

## 5. Contratos

### Etiquetas: creación

```json
// POST /api/tags
{
  "name": "Oferta",
  "color": "#f97316"
}
```

Respuesta: `201 Created` con `{ "tag": { ... } }` y el color normalizado a
`#F97316`.

### Etiquetas: modificación y reactivación

```json
// PATCH /api/tags/5
{
  "name": "Oferta especial",
  "color": "#EA580C",
  "isActive": true
}
```

Respuesta: `200 OK` con `{ "tag": { ... } }`. Un cuerpo vacío devuelve
`400 VALIDATION_ERROR`.

### Categorías: creación

```json
// POST /api/categories
{
  "name": "Congelados",
  "description": "Productos refrigerados y congelados."
}
```

Respuesta: `201 Created` con `{ "category": { ... } }`. Para `admin` incluye
`activeProductCount` (0 al crear). `description` es opcional; si se omite o queda
vacía se guarda como `null`.

### Categorías: modificación y reactivación

```json
// PATCH /api/categories/5
{
  "name": "Congelados premium",
  "description": "Línea premium.",
  "isActive": true
}
```

Respuesta: `200 OK` con `{ "category": { ... } }`. Un cuerpo vacío devuelve
`400 VALIDATION_ERROR`.

### Baja lógica

```json
// DELETE /api/tags/5
{ "tag": { "isActive": false, "...": "resto de la etiqueta" } }
```

```json
// DELETE /api/categories/5
{ "category": { "isActive": false, "activeProductCount": 0, "...": "resto" } }
```

### Errores

```json
{ "error": { "code": "CATEGORY_NAME_TAKEN", "message": "Ya existe una categoría con el nombre \"Congelados\"." } }
```

| Situación                                | Estado | Código                |
| ---------------------------------------- | ------ | --------------------- |
| Cuerpo o parámetros inválidos            | `400`  | `VALIDATION_ERROR`    |
| Etiqueta inexistente                     | `404`  | `TAG_NOT_FOUND`       |
| Categoría inexistente                    | `404`  | `CATEGORY_NOT_FOUND`  |
| Nombre de etiqueta duplicado             | `409`  | `TAG_NAME_TAKEN`      |
| Nombre de categoría duplicado            | `409`  | `CATEGORY_NAME_TAKEN` |
| Categoría inactiva al crear/agregar      | `400`  | `INVALID_CATEGORY`    |
| Etiqueta inactiva al crear/agregar       | `400`  | `INVALID_TAG`         |
| Token ausente, inválido o expirado       | `401`  | `UNAUTHORIZED`        |
| Usuario sin rol `admin` en una mutación  | `403`  | `FORBIDDEN`           |

## 6. Frontend

Las secciones **Etiquetas** y **Categorías** viven en `/dashboard/settings` y
solo se renderizan si `user.role === "admin"`; un empleado no ve las secciones ni
botones deshabilitados. El perfil y las preferencias de Settings siguen siendo
simulados.

Piezas agregadas:

- `services/tag.service.ts` y `services/category.service.ts`: listado, consulta,
  alta, edición y baja.
- `hooks/useTags.ts` y `hooks/useCategories.ts`: estado, carga y recarga.
- `components/tags/TagManager.tsx` y
  `components/categories/CategoryManager.tsx`: formulario, tabla y confirmación
  de baja.
- `getTagErrorMessage` y `getCategoryErrorMessage` en
  `services/notifications.ts` para mostrar el mensaje del backend (por ejemplo,
  nombre duplicado).

Funcionalidad:

- Listado con nombre, estado y, en categorías, descripción recortada.
- Opción para mostrar registros inactivos.
- Alta y edición con validación local y los límites del backend.
- Baja con el `ConfirmDialog` existente y reactivación de inactivos.
- En categorías, el diálogo de baja avisa cuántos productos activos la usan
  cuando `activeProductCount` es mayor a 0.
- Estados de carga, vacío y error con `StateCard`, spinner y clases existentes.

Las mutaciones de etiquetas y categorías emiten el evento `catalog:changed`.
`useCatalog` escucha ese evento y recarga el catálogo que consumen los
formularios de productos.

En el formulario de productos, si el producto en edición tiene una categoría o
etiquetas que ya no están activas, se muestran igualmente marcadas como
“Inactiva”. Así el formulario no pierde la selección ni envía un valor vacío, y
el usuario puede conservarlas o quitarlas.

## 7. Verificación

Comandos ejecutados:

```bash
npx tsc --noEmit -p apps/api/tsconfig.json
npm run lint -w client
npm run build -w client
```

Pruebas manuales con `curl` y la API levantada:

### Etiquetas

1. `POST /api/auth/login` con `admin` / `admin` devuelve el token.
2. `POST /api/tags` crea la etiqueta `Promo Otono` con color `#a1b2c3` y
   responde `201` con `#A1B2C3`.
3. `POST /api/tags` repitiendo el nombre con mayúsculas y espacios devuelve
   `409 TAG_NAME_TAKEN`.
4. `POST /api/tags` con `color: "red"` devuelve `400 VALIDATION_ERROR`.
5. `POST /api/tags` sin nombre devuelve `400 VALIDATION_ERROR`.
6. `PATCH /api/tags/5` modifica nombre y color, y actualiza `updatedAt`.
7. `DELETE /api/tags/5` devuelve la etiqueta con `isActive: false`.
8. `GET /api/tags` no incluye la etiqueta dada de baja.
9. `GET /api/tags?includeInactive=true` sí la incluye para `admin`.
10. `PATCH /api/tags/5` con `isActive: true` la reactiva.
11. `PATCH /api/tags/9999` devuelve `404 TAG_NOT_FOUND`.

### Categorías

1. `POST /api/categories` con nombre y descripción responde `201` e incluye
   `activeProductCount`.
2. `POST /api/categories` repitiendo el nombre con mayúsculas y espacios
   devuelve `409 CATEGORY_NAME_TAKEN`.
3. `POST /api/categories` con nombre vacío o de más de 100 caracteres devuelve
   `400 VALIDATION_ERROR`.
4. `PATCH /api/categories/:id` modifica nombre y descripción y actualiza
   `updatedAt`.
5. `DELETE /api/categories/:id` devuelve la categoría con `isActive: false`.
6. `GET /api/categories` no incluye la categoría dada de baja.
7. `GET /api/categories?includeInactive=true` sí la incluye para `admin`.
8. `PATCH /api/categories/:id` con `isActive: true` la reactiva.
9. `GET /api/categories/1` para `admin` devuelve `activeProductCount` con la
   cantidad de productos activos que usan la categoría.
10. `PATCH /api/categories/9999` devuelve `404 CATEGORY_NOT_FOUND`.

### Permisos

Con un usuario `employee` creado con `POST /api/users`:

- `POST`, `PATCH` y `DELETE` sobre `/api/categories` devuelven
  `403 FORBIDDEN`.
- `GET /api/categories?includeInactive=true` responde `200` e ignora el
  parámetro (no incluye inactivas).

### Fix de edición de productos

1. Se da de baja la categoría y una etiqueta asignadas al producto 1.
2. `PATCH /api/products/1` cambiando solo el precio responde `200` y conserva la
   categoría y la etiqueta inactivas.
3. `PATCH /api/products/1` intentando asignar otra categoría inactiva devuelve
   `400 INVALID_CATEGORY`.
4. `PATCH /api/products/1` intentando agregar una etiqueta inactiva devuelve
   `400 INVALID_TAG`.

## 8. Estado de implementación

- [x] Tipos y validadores declarativos de etiquetas y categorías.
- [x] Repositorios en memoria con `create`, `update` y `softDelete`.
- [x] Servicios con unicidad de nombre, normalización y baja lógica.
- [x] Endpoints protegidos y restricción `admin` para mutaciones.
- [x] Conteo de productos activos por categoría para `admin`.
- [x] Secciones **Etiquetas** y **Categorías** en Settings para administradores.
- [x] Fix de edición de productos con categorías y etiquetas inactivas.
- [x] Verificación de tipos, lint, build y pruebas manuales.

## 9. Trabajo futuro

- Reemplazar los repositorios en memoria de etiquetas y categorías por consultas
  a PostgreSQL.
- Evaluar paginación o búsqueda si el catálogo crece.
