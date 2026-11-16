# Plan de eliminación de datos hardcodeados

Este documento describe el reemplazo de los datos de demostración y de los
arreglos mockeados del cliente por información persistida y consultada a la API.

## 1. Alcance

Incluido:

- Migración del repositorio de productos de un arreglo en memoria a PostgreSQL.
- Eliminación de los productos, categorías y etiquetas sembrados por el script
  de preparación de la base de datos.
- Conservación de un único usuario de arranque, configurado por variables de
  entorno (`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_FULLNAME`, `ADMIN_EMAIL`).
- Eliminación de las credenciales de prueba hardcodeadas de la pantalla de
  login.
- Nuevo módulo de estadísticas en la API (`/api/stats`) con agregaciones reales
  sobre ventas, productos y stock.
- Conexión del panel principal y de la pantalla **Estadísticas** a la API, sin
  arreglos mockeados.

Fuera de alcance:

- Persistencia de las preferencias del panel y de la edición del perfil, que
  siguen simuladas.
- Exportación de reportes.

## 2. Persistencia de productos

`product.repository.ts` ahora usa `pg` y replica las columnas de `products` y la
relación `product_tags`. Las operaciones de escritura que tocan ambas tablas se
ejecutan dentro de una transacción, de modo que el producto y sus etiquetas se
crean, reemplazan o eliminan juntos.

El contrato de la API no cambia: servicios y controladores siguen trabajando con
los mismos tipos, salvo que las operaciones del repositorio pasan a ser
asíncronas. El conteo de productos activos por categoría también se consulta a
la base de datos.

## 3. Datos iniciales

`npm run db:setup -w api` aplica el esquema y crea únicamente el administrador
de arranque. El nombre completo y el correo se toman de `ADMIN_FULLNAME` y
`ADMIN_EMAIL`; si no se definen, se derivan del usuario configurado en
`ADMIN_USERNAME`.

Una base nueva queda sin categorías, etiquetas, productos ni ventas. El
administrador debe crear el catálogo desde la aplicación antes de registrar
ventas.

## 4. Estadísticas

La API expone dos endpoints autenticados:

- `GET /api/stats/overview`: ventas y facturación del mes, ticket promedio,
  cantidad de productos con stock bajo, listado de reposición, facturación de
  los últimos seis meses y últimas ventas.
- `GET /api/stats?period=month|quarter|year`: totales del período actual,
  variaciones contra el período anterior, ganancia estimada, ventas anuladas,
  facturación mensual y productos más vendidos.

Las consultas solo consideran ventas completadas para la facturación y la
ganancia; las anuladas se informan por separado. La ganancia es estimada porque
se calcula con el costo actual del producto y las cantidades históricas de
`sale_products`.

## 5. Verificación

1. Ejecutar `npm run db:setup -w api` sobre una base vacía y confirmar que solo
   se crea el usuario administrador.
2. Iniciar sesión como administrador, crear una categoría, una etiqueta y un
   producto, y verificar que el producto persiste al reiniciar la API.
3. Registrar una venta, comprobar la actualización del stock y anularla para
   confirmar la devolución de unidades.
4. Abrir `/dashboard` y `/dashboard/stats` y verificar que los indicadores,
   gráficos y tablas reflejan las operaciones registradas.
5. Ejecutar `pnpm lint -w client` y los builds de ambos workspaces.
