# Trabajo Integrador Final - UTN

Repositorio correspondiente al Trabajo Final Integrador de la Tecnicatura Universitaria en Programación de la Universidad Tecnológica Nacional.

- [Informe completo](https://docs.google.com/document/d/1VEmq8IQWdE1cVnLsrtFOBDiN8HbyCjLl/edit?usp=drive_link&ouid=104223395228377711470&rtpof=true&sd=true)
- [Documentación del proyecto](docs/README.md)

## Stack tecnológico

| Parte | Tecnología |
|---|---|
| Frontend | React + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Base de datos | PostgreSQL alojado en Render, accedido con `pg` |
| Seguridad | JWT |
| Comunicación | API REST |
| Control de versiones | Git + GitHub |
| Backend en producción | Render |
| Frontend en producción | Vercel |

La base de datos del proyecto es PostgreSQL. Inicialmente se había elegido MongoDB, pero durante la revisión de la arquitectura se decidió cambiar a una base de datos relacional. El motivo es que la información del sistema es relacional y el proyecto depende de consultas que combinan ventas, detalle de venta y productos para obtener las estadísticas. Los motivos completos están registrados en [Decisiones sobre el stack tecnológico](docs/stack-tecnologico/02-decisiones.md).

## Modelo de datos

![Modelo relacional de la base de datos](docs/base-de-datos/db-model.png)

El detalle del modelo, con la definición de cada entidad y las decisiones de diseño que lo sustentan, se encuentra en [Modelo relacional](docs/base-de-datos/01-modelo-relacional.md).

Artefactos asociados:

- Definición del esquema en formato DBML: [dbml.dbml](docs/base-de-datos/dbml.dbml)
- Script de creación de la base de datos: [crear-base-datos.sql](database/crear-base-datos.sql)

## Estado del desarrollo

- Autenticación y autorización con JWT: login (`POST /api/auth/login`) y perfil
  del usuario autenticado (`GET /api/auth/me`).
- CRUD de productos en la API (`/api/products`) con filtros, paginación, baja
  lógica y validación de categorías y etiquetas.
- Endpoints de solo lectura para categorías (`/api/categories`) y etiquetas
  (`/api/tags`).
- Login en la raíz de la aplicación y panel protegido en `/dashboard`.
- Sección **Productos** conectada a la API: listado con filtros y paginación,
  detalle, alta, edición y baja lógica.
- **Settings** incluye la gestión de etiquetas y el alta de usuarios (solo
  `admin`). El perfil y las preferencias siguen simulados.
- Los usuarios se persisten en PostgreSQL. El usuario administrador por defecto
  es `admin` / `admin` y se crea al preparar la base de datos.
- **Ventas** y **Estadísticas** siguen mockeadas.

## Puesta en marcha

1. Copiar `.env.example` a `.env` en la raíz y ajustar los valores si hace
   falta. El archivo `.env` no se versiona. Si se usa la base local por defecto
   no hace falta cambiar `DATABASE_URL`.
2. Instalar dependencias y preparar la base de datos:

```bash
npm install
npm run db:setup -w api
```

El script crea la base si no existe, aplica
[crear-base-datos.sql](database/crear-base-datos.sql) y siembra el usuario
administrador. Es idempotente: se puede volver a ejecutar sin perder datos.

3. Ejecutar la API y el cliente con pnpm:

```bash
pnpm install
pnpm dev
```

O con npm:

```bash
npm install
npm run dev
```

Ambos comandos levantan la API y el cliente en paralelo, con la salida
etiquetada por proceso. Si necesitás verlos por separado, usá
`npm run dev -w api` y `npm run dev -w client` en terminales distintas.

- Cliente: <http://localhost:5173>
- API: <http://localhost:3000>
- En desarrollo, Vite redirige `/api` hacia la API. En producción el cliente usa
  `VITE_API_URL` y la API habilita CORS con los orígenes de `CLIENT_URL`.

Variables de entorno de la API: `DATABASE_URL` (por defecto la base local),
`DATABASE_SSL` (`true` para bases externas; se activa sola cuando el host no es
local), `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_USERNAME`,
`ADMIN_PASSWORD` y `CLIENT_URL` (orígenes permitidos por CORS, separados por
comas). En el cliente se usa `VITE_API_URL` para apuntar a otro backend.

## Deploy

El frontend se publica en Vercel y la API y la base de datos en Render.

1. **Render Postgres**: crear la base en la misma región que el Web Service y
   copiar la *External Database URL*. Aplicar el esquema desde una máquina
   local, definiendo `ADMIN_PASSWORD` antes del primer seed:

```powershell
$env:DATABASE_URL = "postgresql://usuario:clave@dpg-xxxx.oregon-postgres.render.com/utn_tfi"
$env:ADMIN_PASSWORD = "unaClaveLargaYReal"
npm run db:setup -w api
```

El SSL se activa solo porque el host no es local. La base gratuita de Render
expira a los 30 días y no tiene backups.

2. **Render Web Service** (Node 22, root del repo):

- Build Command: `npm install --include=dev && npm run build -w api`
- Start Command: `npm start -w api`
- Health Check Path: `/api/health`
- Variables: `DATABASE_URL` (usar la *Internal Database URL*, solo funciona si
  la base y el servicio están en la misma región), `JWT_SECRET`,
  `CLIENT_URL` (dominio de Vercel) y `JWT_EXPIRES_IN=8h`.

3. **Vercel** (Root Directory `apps/client`, framework Vite):

- Build Command: `npm run build`
- Output Directory: `dist`
- Variable: `VITE_API_URL=https://<servicio>.onrender.com/api`

`apps/client/vercel.json` reescribe todas las rutas a `index.html` para que
funcionen los enlaces profundos del router. `VITE_API_URL` se incorpora al
bundle durante el build, así que hay que volver a desplegar el frontend si
cambia.

`/api/health` responde `200` solo si PostgreSQL está conectado **y** el esquema
está aplicado. Si devuelve `503`, falta correr `npm run db:setup -w api` contra
la base del deploy. Sin esquema, el login responde `500`.
