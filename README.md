# Trabajo Integrador Final - UTN

Repositorio correspondiente al Trabajo Integrador Final de la Tecnicatura Universitaria en Programación de la Universidad Tecnológica Nacional.

## Integrantes

- Mariano Astorga
- Nicolás Arrastía
- Federico Gonzalez

## Descripción del proyecto

Nuestro proyecto consiste en el desarrollo de una aplicación web de gestión comercial orientada a pequeños comercios y emprendimientos.

Como punto de partida, identificamos una posible problemática en comercios que administran sus productos, ventas y stock de forma manual o mediante herramientas que no están integradas entre sí. Esto puede generar dificultades para mantener la información organizada, consultarla rápidamente y utilizarla para analizar el funcionamiento del negocio.

Nuestra propuesta busca no solamente digitalizar estos procesos, sino también centralizar la información y aprovechar los datos registrados para generar estadísticas que puedan ser útiles para la gestión y la toma de decisiones.

La problemática identificada será validada mediante el relevamiento con potenciales usuarios.

## Objetivo

Desarrollar una aplicación web de gestión comercial que permita a pequeños negocios administrar productos, ventas y stock, gestionar usuarios y obtener información estadística que facilite la toma de decisiones.

## Funcionalidades principales

Para la primera versión del sistema planteamos las siguientes funcionalidades:

### Usuarios

- Registro e inicio de sesión.
- Autenticación.
- Roles y permisos.
- Asociación de usuarios a un negocio.

### Productos

- Alta, modificación, consulta y baja lógica.
- Nombre y descripción.
- Precio de venta y costo.
- Categorías y etiquetas.
- Control de stock.
- Estado del producto.

### Ventas

- Registro de ventas.
- Selección de productos y cantidades.
- Cálculo automático del total.
- Actualización del stock.
- Registro del usuario que realizó la venta.

### Dashboard

- Total de ventas.
- Facturación.
- Producto más vendido.
- Producto con mayor facturación.
- Producto con mayor ganancia.
- Productos con bajo stock.

## Tecnologías utilizadas

El stack tecnológico definido inicialmente para el proyecto es:

### Frontend

- React
- JavaScript

### Backend

- Java
- Spring Boot

### Base de datos

- MySQL

### Seguridad

- Spring Security
- JWT

### Otras herramientas

- API REST para la comunicación entre frontend y backend.
- Git y GitHub para el control de versiones y el trabajo colaborativo.
- Render como alternativa para el despliegue de la aplicación.

Elegimos estas tecnologías teniendo en cuenta principalmente nuestra experiencia previa, los contenidos trabajados durante la carrera y las necesidades del proyecto.

## Estructura del repositorio

Todo el proyecto se desarrollará y mantendrá dentro de este repositorio.

La estructura inicial será la siguiente:

```text
UTN-TFI/
│
├── frontend/          # Aplicación frontend desarrollada con React
├── backend/           # API y lógica de negocio desarrollada con Spring Boot
├── database/          # Scripts y archivos relacionados con la base de datos
├── docs/              # Informes, diagramas y documentación del proyecto
│
└── README.md          # Documentación principal del proyecto
```

Esta estructura podrá ajustarse durante el desarrollo según las necesidades del proyecto.

## Instalación y ejecución

El proyecto se encuentra actualmente en una etapa inicial de análisis, relevamiento y diseño.

Las instrucciones necesarias para instalar y ejecutar el frontend, backend y base de datos se agregarán en esta sección a medida que avance el desarrollo y se definan las configuraciones necesarias.

## Alcance del MVP

La primera versión del sistema estará centrada en:

- Gestión y autenticación de usuarios.
- Roles y permisos.
- Gestión de productos.
- Control y actualización de stock.
- Registro de ventas.
- Dashboard con estadísticas sobre ventas, facturación, ganancias y stock.

### Fuera del alcance inicial

Para mantener un alcance viable para el Trabajo Integrador Final, inicialmente no se incluirán:

- Facturación electrónica.
- Integración con medios de pago.
- Contabilidad completa.
- Gestión de proveedores.
- Aplicación móvil nativa.
- Integración con sistemas externos.
- Inteligencia artificial para predicción de ventas.

Estas funcionalidades podrán evaluarse como posibles ampliaciones futuras.

## Estado del proyecto

Actualmente el proyecto se encuentra en etapa de análisis, relevamiento y definición del MVP.

Este repositorio se irá actualizando durante las distintas etapas de desarrollo del Trabajo Integrador Final.