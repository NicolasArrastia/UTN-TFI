# 7. Plan de trabajo

| Etapa | Período | Actividades | Entregable |
|---|---|---|---|
| 1. Propuesta y relevamiento | Hasta 06/09 | Revisión de propuesta, relevamiento, análisis y ajustes del alcance | Propuesta revisada y resultados |
| 2. Diseño y arquitectura | 07/09 al 27/09 | Requisitos, modelo de datos, arquitectura y módulos | Modelo de datos y módulos |
| 3. Base del sistema | 28/09 al 11/10 | Base de datos, estructura backend/frontend, autenticación y usuarios | Estructura inicial funcionando |
| 4. Funcionalidades principales | 12/10 al 25/10 | Productos, ventas, stock e integración | MVP integrado |
| 5. Estadísticas e integración | 26/10 al 01/11 | Dashboard, estadísticas e integración general | Dashboard y MVP integrado |
| 6. Pruebas y correcciones | 02/11 al 08/11 | Pruebas, detección y corrección de errores | Versión probada |
| 7. Entrega final | 09/11 al 14/11 | Despliegue, documentación, repositorio, informe y video | Aplicación y documentación final |

## Duración estimada

En las tablas siguientes, un día equivale a 4 horas de trabajo de un integrante. El equipo tiene tres integrantes y algunas actividades se realizan en paralelo, por lo que la suma de los días de una etapa puede ser mayor que la duración de esa etapa en el calendario.

## Actividades por etapa

### Etapa 1. Propuesta y relevamiento

| Actividad | Días |
| --- | --- |
| Revisión de la propuesta y de la problemática inicial | 1 |
| Relevamiento en el mini mercado, la panadería y la carnicería | 2 |
| Análisis de los resultados y ajuste del alcance | 1 |
| Redacción de la propuesta y los objetivos | 1 |

### Etapa 2. Diseño y arquitectura

| Actividad | Días |
| --- | --- |
| Definición de requisitos y actores | 2 |
| Modelo de datos en DBML y diagrama relacional | 2 |
| Script de creación de la base de datos | 1 |
| Arquitectura de tres capas y definición de módulos | 2 |
| Cambio de stack a PostgreSQL y registro de la decisión | 1 |
| Plan de trabajo, riesgos y viabilidad | 2 |

### Etapa 3. Base del sistema

| Actividad | Días |
| --- | --- |
| Configuración del monorepo y de las dos aplicaciones | 1 |
| Estructura inicial de la API con Express y TypeScript | 1 |
| Estructura inicial del cliente con React y Vite | 1 |
| Autenticación JWT y usuario administrador en memoria | 2 |
| Login, contexto de sesión y panel protegido | 2 |
| Documentación del módulo de autenticación | 1 |

### Etapa 4. Funcionalidades principales

| Actividad | Días |
| --- | --- |
| Repositorios en memoria de categorías, etiquetas y productos | 2 |
| Validadores y servicio de productos | 2 |
| Endpoints de productos con autorización de administrador | 2 |
| Endpoints de solo lectura de categorías y etiquetas | 1 |
| Listado, detalle y formularios de productos en el cliente | 3 |
| Documentación de los planes de productos | 1 |

### Etapa 5. Estadísticas e integración

| Actividad | Días |
| --- | --- |
| Registro de ventas con transacción y descuento de stock | 3 |
| Anulación de ventas y devolución de stock | 1 |
| Consultas de estadísticas por período y por producto | 3 |
| Pantallas de ventas y estadísticas | 2 |
| Integración general del panel | 1 |

### Etapa 6. Pruebas y correcciones

| Actividad | Días |
| --- | --- |
| Pruebas manuales de autenticación y productos | 2 |
| Pruebas de ventas, stock y estadísticas | 2 |
| Corrección de errores detectados | 2 |
| Revisión de documentación y consistencia | 1 |

### Etapa 7. Entrega final

| Actividad | Días |
| --- | --- |
| Despliegue de la API, el cliente y la base en Neon | 2 |
| Documentación final e informe | 2 |
| Preparación del repositorio y del video | 1 |
| Verificación de la entrega | 1 |

> **TODO (equipo):** validar las duraciones estimadas de cada actividad.

## Organización

El equipo está compuesto por tres integrantes. Las actividades que no tienen dependencias entre sí se realizan en paralelo. La prioridad es completar las funcionalidades del MVP y evitar incorporar nuevas funcionalidades que comprometan los tiempos.
