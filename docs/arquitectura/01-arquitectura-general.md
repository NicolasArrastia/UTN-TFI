# 11. Arquitectura del sistema

## 11.1 Arquitectura seleccionada

El sistema utilizará una **arquitectura de tres capas**:

1. **Capa de presentación**
2. **Capa de lógica de negocio**
3. **Capa de acceso a datos**

La arquitectura se complementará con una API REST y autenticación mediante JWT.

## 11.2 Diagrama general

```mermaid
flowchart TB
    U[Usuario] --> F[Frontend<br/>React + TypeScript]
    F -->|HTTP / JSON| API[API REST<br/>Node.js + Express]

    subgraph Backend["Backend - Arquitectura en 3 capas"]
        API --> C[1. Presentación<br/>Routes / Controllers]
        C --> S[2. Lógica de negocio<br/>Services]
        S --> R[3. Acceso a datos<br/>Repositories / Models]
    end

    R --> DB[(MongoDB)]

    S --> AUTH[JWT / Autorización]
```

## 11.3 Capa 1 - Presentación

Esta capa recibe las solicitudes HTTP y devuelve las respuestas.

### Frontend

Tecnología:

- React.
- TypeScript.

Responsabilidades:

- Mostrar la interfaz.
- Formularios.
- Tablas y listados.
- Dashboard.
- Validaciones básicas de entrada.
- Enviar solicitudes a la API.
- Mantener el estado de la interfaz.
- Mostrar mensajes de éxito o error.

### Backend - Controllers y Routes

Express recibe las solicitudes y las deriva al controlador correspondiente.

Responsabilidades:

- Definir endpoints.
- Obtener parámetros, body y usuario autenticado.
- Validar datos de entrada.
- Invocar los servicios correspondientes.
- Construir respuestas HTTP.

Esta capa no debería contener reglas de negocio complejas.

## 11.4 Capa 2 - Lógica de negocio

La capa de servicios concentra las reglas del sistema.

Ejemplos:

- Verificar permisos.
- Comprobar que un producto exista.
- Validar stock suficiente.
- Calcular el total de una venta.
- Actualizar stock.
- Determinar estadísticas.
- Aplicar reglas de baja lógica.
- Coordinar operaciones que involucran varias entidades.

Esta separación evita que las reglas de negocio queden mezcladas con las rutas HTTP o con las consultas a MongoDB.

## 11.5 Capa 3 - Acceso a datos

Esta capa es responsable de comunicarse con MongoDB.

Responsabilidades:

- Consultar documentos.
- Insertar documentos.
- Actualizar documentos.
- Aplicar filtros.
- Ejecutar agregaciones para estadísticas.
- Encapsular el acceso a las colecciones.

Los servicios no deberían depender directamente de detalles de conexión o consultas específicas de la base de datos.

## 11.6 Autenticación y autorización

JWT se utilizará para identificar al usuario.

Flujo simplificado:

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant A as API
    participant S as Auth Service
    participant DB as MongoDB

    U->>F: Inicia sesión
    F->>A: POST /auth/login
    A->>S: Validar credenciales
    S->>DB: Buscar usuario
    DB-->>S: Usuario
    S-->>A: JWT
    A-->>F: Token
    F->>A: Solicitud + JWT
    A->>S: Validar token y permisos
    S-->>A: Usuario autorizado
    A-->>F: Respuesta
```

## 11.7 Roles

El sistema contempla roles para diferenciar el acceso a las funcionalidades.

El rol inicial definido para el proyecto contempla:

- **Admin:** responsable de la administración del negocio y de los usuarios.
- **Employee:** usuario que trabaja con las operaciones permitidas del negocio.

Los permisos concretos se implementarán mediante middleware de autorización y reglas de negocio.

## 11.8 Aislamiento por negocio

Cada usuario estará asociado a un negocio. Las operaciones sobre productos, ventas, categorías y etiquetas deberán respetar ese contexto.

Esto evita que un usuario pueda consultar o modificar información perteneciente a otro negocio.

## 11.9 Justificación de la arquitectura

La arquitectura de tres capas fue elegida por las siguientes razones:

- Separa responsabilidades.
- Facilita el mantenimiento.
- Permite desarrollar frontend y backend de manera independiente.
- Facilita las pruebas.
- Evita mezclar reglas de negocio con acceso a datos.
- Es adecuada para una API REST con Node y Express.
- Se adapta al tamaño y alcance del MVP.
- Es una arquitectura conocida y viable para el equipo.

No se considera necesario utilizar una arquitectura más compleja, como microservicios, para el MVP debido al tamaño del proyecto y a los tiempos disponibles.

## 11.10 Estructura tentativa del backend

```text
backend/
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── models/
│   ├── middlewares/
│   ├── validators/
│   ├── config/
│   └── app.ts
└── package.json
```

La estructura podrá adaptarse durante la implementación sin modificar el principio general de separación por capas.
