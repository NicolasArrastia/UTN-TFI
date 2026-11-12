# Plan de implementación: integración del frontend con la API de productos

Este documento describe el plan para conectar la pantalla **Productos** del
cliente con los endpoints de productos ya implementados en la API. El objetivo
es reemplazar los datos mockeados por operaciones reales de listado, consulta,
alta, edición y baja lógica.

## 1. Alcance

Incluido en esta iteración:

- Listado de productos en una tabla con búsqueda, filtros y paginación.
- Alta de un producto desde el botón **Nuevo producto**.
- Consulta del detalle de un producto.
- Edición de los datos de un producto.
- Baja lógica de un producto con confirmación previa.
- Manejo de estados de carga, error, listado vacío y acceso denegado.
- Respeto de los roles: `admin` administra; `employee` solo consulta.
- Endpoints de solo lectura para categorías y etiquetas, necesarios para los
  formularios de alta y edición.

Fuera de alcance en esta iteración:

- CRUD de categorías y etiquetas.
- Movimientos de stock e historial de precios.
- Carga de imágenes, SKU o código de barras.
- Conexión a PostgreSQL y reemplazo de los repositorios en memoria.
- Pruebas automatizadas del cliente (no hay framework configurado).

## 2. Decisiones técnicas

### Sin dependencias nuevas

El cliente ya usa React 19, React Router 7 y `react-toastify`. La integración
se resuelve con estado local, hooks propios y `fetch`, sin agregar una librería
de consultas ni un manejador de formularios. Así se mantiene el bundle pequeño y
el estilo del proyecto.

### Token centralizado

Hoy el token se guarda en `localStorage` desde `AuthProvider`, pero ningún otro
módulo puede leerlo. Se extrae un almacén `token-storage.ts` y el cliente HTTP
expone una variante autenticada que agrega `Authorization: Bearer <token>`.
`AuthProvider` pasa a usar el mismo almacén para iniciar y cerrar sesión.

### Filtros en la URL

El listado guarda `search`, `categoryId`, `isActive`, `lowStock` y `page` en los
parámetros de búsqueda de la URL. Esto permite recargar la pantalla o volver
desde el detalle sin perder búsqueda, filtros ni página. La búsqueda se
debouncea 350 ms para no disparar una solicitud por tecla.

### Filtrado y paginación en el servidor

La tabla no filtra en memoria: envía los parámetros a `GET /api/products` y usa
`pagination.totalPages`. El límite se fija en 10 productos por página.

### Categorías y etiquetas

El contrato de productos usa `categoryId` y `tagIds`, pero el cliente no tenía
forma de conocer los identificadores válidos. Se agregan dos endpoints de solo
lectura, protegidos por JWT:

- `GET /api/categories` → `{ categories }`
- `GET /api/tags` → `{ tags }`

La API reutiliza los repositorios en memoria existentes. Cuando se implemente
el CRUD de categorías y etiquetas, estos endpoints se amplían sin cambiar el
contrato.

### Roles y permisos

| Acción                        | Rol requerido |
| ----------------------------- | ------------- |
| Listar y ver el detalle       | Autenticado   |
| Crear, editar y dar de baja   | `admin`       |

El cliente oculta las acciones de escritura a los empleados y muestra una
tarjeta de acceso denegado si intentan entrar por URL a las pantallas de alta o
edición. La API sigue siendo la autoridad final.

### Baja lógica

`DELETE /api/products/:id` no elimina el registro: lo marca como inactivo. El
listado por defecto solo muestra activos. El filtro **Todos** permite ver los
inactivos y el detalle permite reactivarlos mediante la edición.

## 3. Estructura del frontend

```text
apps/client/src/
├── components/
│   ├── AdminOnly.tsx
│   ├── ConfirmDialog.tsx
│   └── products/
│       ├── Pagination.tsx
│       ├── ProductFilters.tsx
│       ├── ProductForm.tsx
│       └── ProductTable.tsx
├── hooks/
│   ├── useCatalog.ts
│   ├── useDebouncedValue.ts
│   ├── useProduct.ts
│   └── useProducts.ts
├── pages/dashboard/
│   ├── ProductDetailPage.tsx
│   ├── ProductFormPage.tsx
│   └── ProductsPage.tsx
├── services/
│   ├── api-client.ts
│   ├── catalog.service.ts
│   ├── product.service.ts
│   └── token-storage.ts
└── types/
    └── product.types.ts
```

## 4. Rutas

| Ruta                             | Pantalla                | Acceso        |
| -------------------------------- | ----------------------- | ------------- |
| `/dashboard/products`            | Listado de productos    | Autenticado   |
| `/dashboard/products/new`        | Alta de producto        | `admin`       |
| `/dashboard/products/:id`        | Detalle del producto    | Autenticado   |
| `/dashboard/products/:id/edit`   | Edición del producto    | `admin`       |

Todas cuelgan de `DashboardLayout`, dentro de la ruta protegida existente.

## 5. Contratos consumidos

### Listado

```http
GET /api/products?search=yerba&isActive=true&lowStock=false&page=1&limit=10
Authorization: Bearer <token>
```

```json
{
  "products": [{ "...": "producto" }],
  "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

### Detalle

```http
GET /api/products/:id
```

```json
{ "product": { "...": "producto" } }
```

### Alta

```http
POST /api/products
```

```json
{
  "categoryId": 2,
  "name": "Agua mineral 500 ml",
  "description": "Botella sin gas.",
  "price": 1200,
  "cost": 700,
  "stock": 30,
  "minStock": 10,
  "isActive": true,
  "tagIds": [2]
}
```

### Edición

```http
PATCH /api/products/:id
```

El formulario envía el objeto completo que edita el usuario. La API acepta
actualizaciones parciales, por lo que el contrato queda preparado para futuras
ediciones rápidas.

### Baja

```http
DELETE /api/products/:id
```

Devuelve el producto con `isActive: false`. La operación es idempotente.

## 6. Comportamiento de las pantallas

### Listado

- Encabezado con el total de productos y el botón **Nuevo producto** (solo
  `admin`).
- Buscador por nombre.
- Filtros: estado (`Activos`, `Inactivos`, `Todos`), categoría, stock bajo.
- Tabla: producto, categoría, precio, stock, estado y acciones.
- Columnas de acciones: ver detalle, editar y dar de baja (estas dos últimas
  solo para `admin`).
- Paginación anterior/siguiente y número de página.
- Estados: cargando, error con reintento, sin resultados.
- La baja abre un diálogo de confirmación con el nombre del producto.

### Detalle

- Enlace para volver al listado.
- Nombre, estado, categoría, etiquetas y descripción.
- Precio, costo y margen bruto calculado.
- Stock actual, stock mínimo y aviso de stock bajo.
- Fechas de creación y última modificación.
- Acciones de edición y baja para `admin`.
- Si el producto no existe, tarjeta de error con enlace al listado.

### Alta y edición

- Formulario compartido por ambas pantallas.
- Campos: nombre, categoría, descripción, precio, costo, stock, stock mínimo,
  estado y etiquetas.
- Validación en el cliente antes de enviar, con mensajes en español.
- Botón de envío con estado de carga y errores de la API visibles.
- Al crear, redirige al detalle del producto nuevo.
- Al editar, redirige al detalle con los datos actualizados.
- Si no hay categorías disponibles, se impide el envío y se explica el motivo.

## 7. Manejo de errores

Los códigos de la API se traducen a mensajes claros:

| Código              | Mensaje                                                     |
| ------------------- | ----------------------------------------------------------- |
| `NETWORK_ERROR`     | No se pudo conectar con el servidor.                         |
| `VALIDATION_ERROR`  | Se muestra el mensaje devuelto por la API.                   |
| `INVALID_CATEGORY`  | La categoría seleccionada no está disponible.                |
| `INVALID_TAG`       | Alguna etiqueta seleccionada no está disponible.             |
| `PRODUCT_NOT_FOUND` | El producto ya no existe.                                    |
| `FORBIDDEN`         | No tenés permisos para realizar esta acción.                 |
| `UNAUTHORIZED`      | La sesión expiró; se debe iniciar sesión nuevamente.         |

## 8. Pasos y commits

Cada paso es un commit atómico y deja el cliente compilando.

1. `docs: add product frontend integration plan`
2. `feat(api): expose read-only category and tag endpoints`
3. `feat(client): add product API client, types and hooks`
4. `feat(client): list products with filters and pagination`
5. `feat(client): add product detail view`
6. `feat(client): create and edit products from the panel`
7. `docs: document product frontend integration status`

## 9. Verificación

Comandos:

```bash
npx tsc --noEmit -p apps/api/tsconfig.json
npm run lint -w client
npm run build -w client
```

Pruebas manuales:

1. Iniciar sesión con `admin` / `admin`.
2. Abrir **Productos** y comprobar que la tabla muestra los productos de la API.
3. Buscar por nombre, filtrar por categoría, por estado y por stock bajo.
4. Navegar entre páginas del listado.
5. Recargar la página y comprobar que los filtros se conservan en la URL.
6. Crear un producto y verificar que aparece en el listado y en su detalle.
7. Editar un producto y comprobar los cambios en el detalle.
8. Dar de baja un producto, confirmar y verificar que desaparece del filtro
   **Activos** y aparece en **Todos**.
9. Entrar como `employee` (si se sembró un usuario) y comprobar que no se
   muestran las acciones de escritura.
10. Detener la API y comprobar el mensaje de error con opción de reintento.

## 10. Riesgos

- **Token expirado:** la API devuelve `401`. El cliente muestra el error, pero
  no cierra la sesión automáticamente en esta iteración; queda como mejora.
- **Datos en memoria:** reiniciar la API descarta los productos creados. Es
  esperado hasta conectar PostgreSQL.
- **Categorías y etiquetas fijas:** los endpoints son de solo lectura; no se
  pueden crear desde el formulario de productos.
- **Concurrencia:** dos usuarios pueden editar el mismo producto; la última
  escritura gana porque no hay control de versiones.

## 11. Trabajo futuro

- Cerrar la sesión automáticamente ante un `401`.
- Implementar el CRUD de categorías y etiquetas.
- Reemplazar los repositorios en memoria por PostgreSQL.
- Agregar pruebas de componentes y de integración.
- Incorporar imágenes, SKU y código de barras.

## 12. Estado de implementación

La integración se implementó en la rama `feat/client-products-api-integration`:

- [x] Endpoints de solo lectura de categorías y etiquetas.
- [x] Cliente HTTP autenticado y almacén de token compartido.
- [x] Tipos, servicios y hooks de productos y catálogo.
- [x] Listado con búsqueda, filtros, paginación y baja con confirmación.
- [x] Detalle de producto.
- [x] Alta y edición con validación en el cliente.
- [x] Protección de las pantallas de escritura para `admin`.
- [x] Conservación de búsqueda, filtros y página al volver del detalle.
- [x] Verificación con `tsc`, `eslint`, `build` y pruebas manuales de la API.

Quedan pendientes las pruebas automatizadas, el cierre automático de sesión ante
un `401` y el reemplazo de los repositorios en memoria por PostgreSQL.
