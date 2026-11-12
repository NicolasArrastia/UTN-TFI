# Plan de implementación: módulo de etiquetas

Este documento describe el CRUD de etiquetas (tags) del MVP, tanto en la API
como en el cliente. Las categorías siguen siendo un catálogo de solo lectura y
quedan fuera del alcance de esta iteración.

## 1. Alcance

Incluido:

- Alta, listado, consulta, modificación y baja lógica de etiquetas.
- Reactivación con `PATCH` enviando `isActive: true`.
- Nombre único sin distinguir mayúsculas, minúsculas ni espacios extremos.
- Color hexadecimal `#RRGGBB` normalizado a mayúsculas.
- Restricción de escritura exclusiva para el rol `admin`.
- Sección **Etiquetas** dentro de **Settings** en el cliente, visible solo para
  administradores.
- Sincronización del catálogo que usan los formularios de productos.

Fuera de alcance:

- CRUD de categorías.
- Conexión a PostgreSQL y migraciones de Prisma.
- Permisos más finos que `admin` / `employee`.

## 2. Decisiones

### Persistencia en memoria

El repositorio de etiquetas sigue en memoria porque PostgreSQL todavía no está
conectado. Replica las columnas de la tabla `tags` y ahora agrega `create`,
`update` y `softDelete`, además de las lecturas que ya usaba el módulo de
productos (`findById` y `findActiveById`).

### Baja lógica

`DELETE /api/tags/:id` actualiza `is_active` a `false`; el registro no se
elimina. La operación es idempotente: repetir la baja devuelve la etiqueta ya
inactiva. Una etiqueta inactiva:

- No aparece en el listado por defecto.
- Puede consultarse por ID.
- Puede reactivarse con `PATCH` enviando `isActive: true`.
- No puede asignarse a productos nuevos o editados.

### Listado con inactivas

`GET /api/tags?includeInactive=true` incluye las etiquetas inactivas únicamente
si el usuario autenticado es `admin`. Para un `employee` el parámetro se
ignora y la respuesta solo contiene activas (no se devuelve `403`). La decisión
prioriza que el catálogo de productos del empleado siga funcionando sin errores
mientras la restricción de escritura se valida en el backend.

### Coherencia con productos

El servicio de productos ya valida cada etiqueta con
`tagRepository.findActiveById`, por lo que una etiqueta inactiva no puede
asignarse en altas ni en modificaciones. Los productos que ya la tenían la
conservan porque, si el `PATCH` del producto no envía `tagIds`, el servicio
mantiene la lista actual. No fue necesario modificar el contrato de productos.

### Normalización de nombres y colores

- `name` se recorta y se compara sin distinguir mayúsculas/minúsculas ni
  espacios extremos.
- `color` debe cumplir `#RRGGBB` y se guarda en mayúsculas.

## 3. Modelo de datos en memoria

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

## 4. Endpoints

Todas las rutas requieren `Authorization: Bearer <token>`.

| Método   | Ruta               | Acceso      | Descripción                                      |
| -------- | ------------------ | ----------- | ------------------------------------------------ |
| `GET`    | `/api/tags`        | Autenticado | Lista etiquetas activas; admite `includeInactive` |
| `GET`    | `/api/tags/:id`    | Autenticado | Devuelve una etiqueta, activa o inactiva          |
| `POST`   | `/api/tags`        | `admin`     | Crea una etiqueta                                 |
| `PATCH`  | `/api/tags/:id`    | `admin`     | Modifica parcialmente o reactiva                  |
| `DELETE` | `/api/tags/:id`    | `admin`     | Da de baja lógica                                 |

### Parámetro del listado

| Parámetro        | Valores          | Descripción                                              |
| ---------------- | ---------------- | -------------------------------------------------------- |
| `includeInactive`| `true` o `false` | Por defecto `false`; solo se aplica al rol `admin`       |

## 5. Contratos

### Creación

```json
// POST /api/tags
{
  "name": "Oferta",
  "color": "#f97316"
}
```

Respuesta: `201 Created` con `{ "tag": { ... } }` y el color normalizado a
`#F97316`.

### Modificación y reactivación

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

### Baja lógica

```json
// DELETE /api/tags/5
{ "tag": { "isActive": false, "...": "resto de la etiqueta" } }
```

### Errores

```json
{ "error": { "code": "TAG_NAME_TAKEN", "message": "Ya existe una etiqueta con el nombre \"Oferta\"." } }
```

| Situación                                | Estado | Código             |
| ---------------------------------------- | ------ | ------------------ |
| Cuerpo o parámetros inválidos            | `400`  | `VALIDATION_ERROR` |
| Etiqueta inexistente                     | `404`  | `TAG_NOT_FOUND`    |
| Nombre duplicado                         | `409`  | `TAG_NAME_TAKEN`   |
| Token ausente, inválido o expirado       | `401`  | `UNAUTHORIZED`     |
| Usuario sin rol `admin` en una mutación  | `403`  | `FORBIDDEN`        |

## 6. Frontend

La sección **Etiquetas** vive en `/dashboard/settings` y solo se renderiza si
`user.role === "admin"`; un empleado no ve la sección ni botones deshabilitados.
El perfil y las preferencias de Settings siguen siendo simulados.

Piezas agregadas:

- `services/tag.service.ts`: listado, consulta, alta, edición y baja.
- `hooks/useTags.ts`: estado, carga y recarga del listado.
- `components/tags/TagManager.tsx`: formulario, tabla y confirmación de baja.
- `getTagErrorMessage` en `services/notifications.ts` para mostrar el mensaje
  del backend (por ejemplo, nombre duplicado).

Funcionalidad:

- Listado con nombre, muestra visual del color y estado.
- Opción para mostrar etiquetas inactivas.
- Alta y edición con `input type="color"` y el valor hexadecimal visible.
- Baja con el `ConfirmDialog` existente y reactivación de inactivas.
- Estados de carga, vacío y error con `StateCard`, spinner y clases existentes.

Las mutaciones de etiquetas emiten el evento `catalog:changed`. `useCatalog`
escucha ese evento y recarga las etiquetas que consumen los formularios de
productos, de modo que no queden datos desactualizados.

## 7. Verificación

Comandos ejecutados:

```bash
npx tsc --noEmit -p apps/api/tsconfig.json
npm run lint -w client
npm run build -w client
```

Pruebas manuales con `curl` y la API levantada:

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
12. Con un token de rol `employee`, `POST`, `PATCH` y `DELETE` devuelven
    `403 FORBIDDEN`; `GET /api/tags?includeInactive=true` responde `200` e
    ignora el parámetro.
13. Un producto con una etiqueta ya asignada la conserva al editar otros campos,
    y las altas o ediciones que intentan asignar una etiqueta inactiva
    devuelven `400 INVALID_TAG`.

El repositorio de usuarios en memoria solo siembra `admin`. Para probar el
`403` se firmó manualmente un JWT con rol `employee` y el secreto de
desarrollo; no se agregó un usuario `employee` al seed.

## 8. Estado de implementación

- [x] Tipos y validador declarativo de etiquetas.
- [x] Repositorio en memoria con `create`, `update` y `softDelete`.
- [x] Servicio con unicidad de nombre, normalización y baja lógica.
- [x] Endpoints protegidos y restricción `admin` para mutaciones.
- [x] Sección **Etiquetas** en Settings visible solo para administradores.
- [x] Verificación de tipos, lint, build y pruebas manuales.

## 9. Trabajo futuro

- Implementar el CRUD de categorías con el mismo patrón.
- Reemplazar los repositorios en memoria por consultas a PostgreSQL.
- Evaluar paginación o búsqueda si el catálogo de etiquetas crece.
