# Plan de implementación: autenticación y autorización

Este documento describe el plan para incorporar el módulo de autenticación y
autorización (RF-02, RF-03, RF-04 y RF-15) al MVP, junto con el panel inicial
del frontend.

## 1. Alcance

- Login con usuario y contraseña contra la API.
- Emisión y validación de tokens JWT.
- Autorización por rol (`admin` / `employee`).
- Usuario administrador por defecto: **usuario `admin` / contraseña `admin`**.
- Pantalla de login en la raíz de la web (`/`).
- Panel protegido (`/dashboard`) con las secciones mockeadas:
  - Products
  - Ventas
  - Estadísticas
  - Settings
- Notificaciones de login con una librería de toasts: credenciales
  incorrectas, servidor no disponible, campos vacíos, sesión expirada, éxito.

## 2. Decisiones técnicas

### Persistencia inicial en memoria

La base de datos PostgreSQL todavía no está conectada: no hay Prisma, ni
dependencia `pg`, ni credenciales `.env`. Para no bloquear el avance del MVP,
la primera iteración usa un repositorio en memoria con el usuario `admin`
sembrado al iniciar la API.

El repositorio respeta la separación en tres capas, por lo que el reemplazo
por PostgreSQL en una iteración posterior solo requiere cambiar
`repositories/user.repository.ts` y sumar el cliente de base de datos, sin
tocar controladores ni servicios.

### Contraseñas

La contraseña se guarda como hash con `bcryptjs` (nunca en texto plano),
incluso en el repositorio en memoria. La contraseña por defecto se puede
sobrescribir con las variables `ADMIN_USERNAME` y `ADMIN_PASSWORD`.

### JWT

- Firma con `HS256` usando `JWT_SECRET`.
- Expiración configurable con `JWT_EXPIRES_IN` (por defecto `8h`).
- El token incluye `sub`, `username` y `role`.
- El frontend lo persiste en `localStorage` y lo envía como
  `Authorization: Bearer <token>`.
- `GET /api/auth/me` valida el token al recargar la aplicación.

### Toasts

Se utiliza `react-hot-toast` por ser una dependencia pequeña, sin estilos
globales obligatorios y con una API simple. Los mensajes se centralizan en un
helper para mantener consistencia entre pantallas.

## 3. Backend (`apps/api`)

Estructura a incorporar:

```text
src/
├── config/env.ts
├── controllers/auth.controller.ts
├── errors/app-error.ts
├── middlewares/auth.middleware.ts
├── middlewares/error.middleware.ts
├── repositories/user.repository.ts
├── routes/auth.routes.ts
├── services/auth.service.ts
├── types/auth.types.ts
└── types/express.d.ts
```

Endpoints:

| Método | Ruta             | Acceso        | Descripción                          |
| ------ | ---------------- | ------------- | ------------------------------------ |
| POST   | `/api/auth/login`| Público       | Valida credenciales y devuelve JWT   |
| GET    | `/api/auth/me`   | Autenticado   | Devuelve el usuario del token        |

Respuestas:

```json
// POST /api/auth/login
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "fullname": "Administrador",
    "username": "admin",
    "email": "admin@ejemplo.com",
    "role": "admin",
    "isActive": true
  }
}
```

```json
// Error
{ "error": { "code": "INVALID_CREDENTIALS", "message": "Usuario o contraseña incorrectos." } }
```

Reglas:

- Usuario o contraseña incorrectos → `401 INVALID_CREDENTIALS` (mismo mensaje
  para ambos casos, para no filtrar qué dato falló).
- Usuario deshabilitado → `403 USER_INACTIVE`.
- Campos faltantes → `400 VALIDATION_ERROR`.
- Token ausente, inválido o expirado → `401 UNAUTHORIZED`.
- Rol sin permisos → `403 FORBIDDEN`.

## 4. Frontend (`apps/client`)

Estructura a incorporar:

```text
src/
├── components/ProtectedRoute.tsx
├── context/auth-context.ts
├── context/AuthProvider.tsx
├── hooks/useAuth.ts
├── layouts/DashboardLayout.tsx
├── pages/LoginPage.tsx
├── pages/dashboard/OverviewPage.tsx
├── pages/dashboard/ProductsPage.tsx
├── pages/dashboard/SalesPage.tsx
├── pages/dashboard/StatsPage.tsx
├── pages/dashboard/SettingsPage.tsx
├── services/api-client.ts
├── services/auth.service.ts
├── styles/global.css
└── types/auth.types.ts
```

Rutas:

| Ruta                    | Pantalla                         | Protección   |
| ----------------------- | -------------------------------- | ------------ |
| `/`                     | Login                            | Solo invitado|
| `/dashboard`            | Resumen del panel                | Autenticado  |
| `/dashboard/products`   | Products (mockeado)              | Autenticado  |
| `/dashboard/sales`      | Ventas (mockeado)                | Autenticado  |
| `/dashboard/stats`      | Estadísticas (mockeado)          | Autenticado  |
| `/dashboard/settings`   | Settings (mockeado)              | Autenticado  |

Comportamiento:

- La raíz `/` muestra el login. Si ya hay sesión válida, redirige al panel.
- Al iniciar sesión correctamente se navega a `/dashboard`.
- Si la API no responde, el toast indica que el servidor no está disponible.
- Al recargar, el contexto valida el token con `/api/auth/me`; si expiró, se
  limpia la sesión y se notifica.
- El panel muestra los datos del usuario y permite cerrar sesión.

Configuración de desarrollo:

- Proxy de Vite de `/api` hacia `http://localhost:3000` para evitar CORS.
- Variable opcional `VITE_API_URL` para apuntar a otro backend.

## 5. Seguridad y alcance

- El usuario `admin`/`admin` es un valor por defecto de desarrollo; debe
  cambiarse por variables de entorno en producción.
- `JWT_SECRET` también debe definirse por entorno; el valor por defecto es
  solo para desarrollo.
- No se implementa registro de usuarios ni refresh tokens en esta iteración:
  quedan para el módulo de gestión de usuarios.

## 6. Pasos y commits

1. `docs: add authentication implementation plan`
2. `chore(api): add JWT dependencies and environment config`
3. `feat(api): add JWT auth module with seeded admin user`
4. `chore(client): add router and toast dependencies with API proxy`
5. `feat(client): add auth context and login page with toast feedback`
6. `feat(client): add dashboard layout with mocked sections`
7. `docs: document authentication module and update repo guidance`

Cada commit debe dejar el repositorio compilando (`tsc` en la API, `lint` y
`build` en el cliente) y contar con un mensaje que describa una única tarea.

## 7. Verificación

- `npx tsc --noEmit -p apps/api/tsconfig.json`
- `npm run lint -w client`
- `npm run build -w client`
- Prueba manual:
  1. API apagada → toast de servidor no disponible.
  2. Credenciales incorrectas → toast de credenciales inválidas.
  3. `admin` / `admin` → redirección al dashboard.
  4. Recargar → la sesión se mantiene.
  5. Cerrar sesión → vuelve al login.

## 8. Trabajo futuro

- Reemplazar el repositorio en memoria por PostgreSQL.
- Registro de usuarios y administración de roles.
- Refresh tokens o sesiones con expiración deslizante.
- Rate limiting en el endpoint de login.
