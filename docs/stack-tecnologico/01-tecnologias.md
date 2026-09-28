# 6. Stack tecnológico

## 6.1 Tecnologías

| Parte | Tecnología |
|---|---|
| Frontend | React + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Base de datos | PostgreSQL alojado en Neon |
| Seguridad | JWT |
| Comunicación | API REST |
| Control de versiones | Git + GitHub |
| Backend en producción | Render |
| Frontend en producción | Vercel |

## 6.2 Justificación

### React + TypeScript

React fue elegido porque el equipo posee experiencia previa y permite construir una interfaz mediante componentes reutilizables.

TypeScript permite definir de forma más clara las estructuras de datos utilizadas por el sistema, como productos, ventas y usuarios.

### Node.js + Express + TypeScript

Elegimos Node.js y Express porque contamos con experiencia previa y nos permiten desarrollar una API REST para comunicar el frontend con la lógica del sistema.

En el backend también utilizaremos TypeScript para definir los tipos de datos que manejamos, detectar ciertos errores durante el desarrollo y facilitar la comprensión y el mantenimiento del código.

### PostgreSQL y Neon

Elegimos PostgreSQL porque consideramos que el modelo relacional se adapta a la información del sistema y a las relaciones entre usuarios, productos, ventas y sus detalles. Además, permite utilizar consultas SQL para obtener las estadísticas previstas y transacciones para registrar una venta junto con la actualización del stock, de manera que ambas operaciones se completen o se reviertan si ocurre un error.

Para alojar la base de datos utilizaremos Neon, lo que nos permite trabajar con PostgreSQL en la nube sin administrar un servidor de base de datos propio.

La elección inicial de MongoDB y los motivos del cambio están documentados en [Decisiones tecnológicas](02-decisiones.md).

### JWT

JWT será utilizado para autenticar a los usuarios. El token permitirá identificar al usuario en las solicitudes al backend y controlar el acceso según sus permisos.

### API REST

La API REST permite separar la interfaz de usuario de la lógica del servidor. El frontend se comunica con el backend mediante solicitudes HTTP.

### Git y GitHub

Git permite controlar versiones y GitHub centraliza el repositorio, facilitando el trabajo colaborativo entre los tres integrantes.

### Render y Vercel

Render se utilizará inicialmente para desplegar el backend y Vercel para el frontend. Ambas opciones simplifican el despliegue del MVP académico sin necesidad de administrar infraestructura propia.
