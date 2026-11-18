# Plan de ordenamiento y filtros

Este documento describe el ordenamiento por columnas de los listados de
productos y ventas, y los filtros del historial de ventas con su resumen de
totales.

## 1. Objetivo

- Permitir que los listados de **Productos** y **Ventas** se ordenen desde el
  encabezado de cada columna.
- Permitir filtrar el historial de ventas por empleado, rango de fechas y
  estado, conservando el estado en la URL para compartir la vista.
- Mostrar un resumen compacto de las ventas filtradas sin sumar las anuladas.
- Mantener las reglas de rol: los empleados solo ven sus propias ventas.

## 2. Contrato de la API

### 2.1 Ordenamiento

`GET /api/products` y `GET /api/sales` aceptan `sortBy` y `sortDir`
(`asc` o `desc`). El servidor resuelve la clave contra una whitelist y usa una
expresión SQL fija; nunca interpola el valor enviado por el cliente. Un valor
fuera de la whitelist responde `400` con un mensaje en español. Al final del
`ORDER BY` siempre se agrega `id` como desempate para que la paginación sea
estable.

Productos (por defecto `name` `asc`):

| `sortBy`   | Expresión SQL              |
| ---------- | -------------------------- |
| `name`     | `lower(p.name)`            |
| `category` | `lower(c.name)`            |
| `price`    | `p.price`                  |
| `stock`    | `p.stock`                  |
| `isActive` | `p.is_active`              |

`category` usa `LEFT JOIN public.categories` y `NULLS LAST`, por lo que los
productos sin categoría quedan al final.

Ventas (por defecto `createdAt` `desc`):

| `sortBy`        | Expresión SQL         |
| --------------- | --------------------- |
| `number`        | `s.number`            |
| `createdAt`     | `s.created_at`        |
| `user`          | `lower(u.fullname)`   |
| `total`         | `s.total`             |
| `paymentMethod` | `s.payment_method`    |
| `status`        | `s.status`            |

`user` usa `LEFT JOIN public.users`. El orden del enum `sale_status` es el de
declaración en PostgreSQL: `completed` antes que `cancelled`.

### 2.2 Filtros del historial

`GET /api/sales` acepta además:

- `userId`: entero positivo.
- `from` y `to`: formato `YYYY-MM-DD` y fecha real. Si vienen ambos,
  `from <= to`.
- `status`: `completed` o `cancelled`.
- `page` y `limit`, con los mismos límites que antes (máximo 100).

Los dos extremos del rango son inclusivos y se interpretan en la hora de
Argentina (`America/Argentina/Buenos_Aires`), porque `created_at` es
`TIMESTAMPTZ`:

```sql
s.created_at >= ($from::date::timestamp AT TIME ZONE $tz)
s.created_at <  (($to::date + 1)::timestamp AT TIME ZONE $tz)
```

### 2.3 Reglas de rol

- **Administrador**: si envía `userId`, ve solo las ventas de ese usuario; si
  no, ve todas.
- **Empleado**: el `userId` de la consulta se ignora y siempre ve sus propias
  ventas. Puede usar `from`, `to`, `status` y el ordenamiento. El detalle de una
  venta ajena responde `404 SALE_NOT_FOUND`.

### 2.4 Respuesta

Cada venta del listado incluye `userName` (o `null`) y la respuesta agrega un
`summary` calculado con el mismo `WHERE` pero sin paginar:

```ts
summary: {
  completedCount: number;
  completedTotal: string;
  cancelledCount: number;
}
```

`completedTotal` solo suma las ventas completadas; las anuladas se informan por
su cantidad y no se suman.

## 3. Cambios en el cliente

### 3.1 Encabezados ordenables

`components/SortableHeader.tsx` renderiza el `<th>` con un botón, el ícono de
dirección (▲/▼, tenue cuando la columna no es la activa) y `aria-sort`
(`ascending`, `descending` o `none`). Al hacer clic en otra columna se aplica
su dirección por defecto (texto `asc`; fecha, números y total `desc`); en la
columna activa se invierte la dirección.

### 3.2 Productos

`ProductsPage.tsx` guarda `sortBy` y `sortDir` en la URL con
`useSearchParams`. Un valor inválido cae al default (`name` `asc`) y los
valores por defecto no se escriben en la URL. `services/product.service.ts`
envía los parámetros a la API y `ProductTable.tsx` los recibe por props.

### 3.3 Ventas

Todo el estado del historial (`page`, `sortBy`, `sortDir`, `userId`, `from`,
`to` y `status`) vive en la URL, por ejemplo:

```
/dashboard/sales?userId=3&from=2026-11-01&to=2026-11-15
```

Cualquier cambio de filtro u orden resetea `page`. El listado y el detalle se
consultan con `services/sale.service.ts`, y los tipos compartidos están en
`types/sale.types.ts`.

La barra de filtros (`components/sales/SalesFilters.tsx`) incluye:

- Selector de empleado visible solo para administradores, con los usuarios
  (incluidos los inactivos que tienen ventas históricas).
- Fechas `Desde` y `Hasta` con `min`/`max` cruzados.
- Estado: todas, completadas o anuladas.
- Botón **Limpiar filtros**, visible solo con algún filtro activo.

Cuando hay filtros activos se muestra un resumen del tipo
`12 ventas completadas · $ 45.300 · 2 anuladas`, formateado con
`formatCurrency`. Para los empleados el resumen corresponde a sus propias
ventas. El estado vacío con filtros indica que no hay ventas para la selección
y ofrece limpiar los filtros.

## 4. Verificación

1. `npm run build -w api`, `npm run build -w client` y
   `npm run lint -w client` sin errores.
2. `sortBy` inválido responde `400`; `sortBy=price&sortDir=desc` ordena bien
   entre páginas.
3. Un administrador con `userId`, `from` y `to` recibe solo las ventas de ese
   usuario en el rango, incluyendo las del día `to` a las 23:59 de Argentina.
4. Un empleado que envía el `userId` de otro usuario solo recibe las propias, y
   el detalle ajeno responde `404`.
5. `from > to` responde `400`.
6. El `summary` coincide con las filas filtradas y no suma las anuladas.
