# 6. Stack tecnológico

## 6.1 Tecnologías

| Parte | Tecnología |
|---|---|
| Frontend | React + TypeScript |
| Backend | Node.js + Express |
| Base de datos | MongoDB |
| Seguridad | JWT |
| Comunicación | API REST |
| Control de versiones | Git + GitHub |
| Backend en producción | Render |
| Frontend en producción | Vercel |

## 6.2 Justificación

### React + TypeScript

React fue elegido porque el equipo posee experiencia previa y permite construir una interfaz mediante componentes reutilizables.

TypeScript permite definir de forma más clara las estructuras de datos utilizadas por el sistema, como productos, ventas y usuarios.

### Node.js + Express

Node.js y Express permiten desarrollar una API REST de forma sencilla y mantener una separación clara entre frontend y backend.

Además, son tecnologías conocidas por el equipo, lo que reduce el riesgo de incorporar herramientas completamente nuevas durante el proyecto.

### MongoDB

MongoDB fue seleccionado por su flexibilidad y por su adaptación a las estructuras de datos del sistema. También es una tecnología con la que el equipo tiene experiencia previa.

Las ventas pueden contener su propio detalle de productos, lo que resulta apropiado para representar una operación como un documento.

### JWT

JWT será utilizado para autenticar a los usuarios. El token permitirá identificar al usuario en las solicitudes al backend y controlar el acceso según sus permisos.

### API REST

La API REST permite separar la interfaz de usuario de la lógica del servidor. El frontend se comunica con el backend mediante solicitudes HTTP.

### Git y GitHub

Git permite controlar versiones y GitHub centraliza el repositorio, facilitando el trabajo colaborativo entre los tres integrantes.

### Render y Vercel

Render se utilizará inicialmente para desplegar el backend y Vercel para el frontend. Ambas opciones simplifican el despliegue del MVP académico sin necesidad de administrar infraestructura propia.
