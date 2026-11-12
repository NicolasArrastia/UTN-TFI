# Trabajo Integrador Final - UTN

Repositorio correspondiente al Trabajo Final Integrador de la Tecnicatura Universitaria en Programación de la Universidad Tecnológica Nacional.

- [Informe completo](https://docs.google.com/document/d/1VEmq8IQWdE1cVnLsrtFOBDiN8HbyCjLl/edit?usp=drive_link&ouid=104223395228377711470&rtpof=true&sd=true)
- [Documentación del proyecto](docs/README.md)

## Stack tecnológico

| Parte | Tecnología |
|---|---|
| Frontend | React + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Base de datos | PostgreSQL alojado en Neon, accedido con `pg` |
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

1. Tener PostgreSQL disponible y definir `DATABASE_URL` si no se usa la base
   local por defecto (`postgres://postgres:postgres@localhost:5432/utn_tfi`).
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
- Vite redirige `/api` hacia la API, por lo que no hace falta configurar CORS.

Variables de entorno de la API: `DATABASE_URL` (por defecto la base local),
`DATABASE_SSL` (`true` para Neon; se activa sola cuando el host no es local),
`PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_USERNAME` y `ADMIN_PASSWORD`. En
el cliente se puede usar `VITE_API_URL` para apuntar a otro backend.
