# Trabajo Integrador Final - UTN

Repositorio correspondiente al Trabajo Integrador Final de la Tecnicatura Universitaria en Programación de la Universidad Tecnológica Nacional.

[Informe Completo](https://drive.google.com/drive/folders/1qmHW4E682uEEiqG2EBWcNyQU8OOAFTsm?usp=sharing)

## Integrantes

- Mariano Astorga
- Nicolás Arrastía
- Federico Gonzalez

## Descripción del proyecto

Nuestro proyecto consiste en el desarrollo de una aplicación web de gestión comercial orientada a pequeños comercios y emprendimientos.

Como punto de partida, identificamos una posible problemática en comercios que administran sus productos, ventas y stock de forma manual o mediante herramientas que no están integradas entre sí.

A partir del relevamiento realizado encontramos diferentes formas de registrar y administrar la información, incluyendo procesos manuales, registros parciales y el uso de distintas herramientas durante la actividad cotidiana de los comercios analizados.

El problema que buscamos abordar no se encuentra solamente en el uso de herramientas manuales, sino también en que parte de la información puede quedar sin registrar, registrarse de forma parcial o quedar distribuida entre distintos medios. Esto dificulta mantener un historial detallado y aprovechar posteriormente los datos para analizar las ventas, los productos y el stock.

Nuestra propuesta busca centralizar esta información en una aplicación web y aprovechar los datos registrados para mantener un historial de las operaciones, actualizar el stock y generar estadísticas que puedan ser útiles para la gestión del negocio.

## Objetivo

Desarrollar una aplicación web que permita centralizar la gestión de productos, ventas y stock de pequeños comercios, y aprovechar la información registrada para facilitar el control y análisis del negocio.

## Funcionalidades principales

Para la primera versión del sistema definimos las siguientes funcionalidades:

### Usuarios

- Registrar usuarios e iniciar sesión.
- Autenticar a los usuarios del sistema.
- Diferenciar el acceso a las funcionalidades según el rol asignado.
- Permitir que varios usuarios puedan trabajar sobre la información de un mismo negocio.

### Productos

- Registrar nuevos productos.
- Consultar los productos existentes.
- Modificar la información de un producto.
- Realizar la baja lógica de productos.
- Clasificar los productos por categoría y etiquetas.
- Registrar y consultar el stock disponible.

Cada producto contará con información como nombre, descripción, precio de venta, costo, categoría, etiquetas, stock y estado.

### Ventas

- Registrar una nueva venta.
- Seleccionar los productos y cantidades correspondientes.
- Calcular automáticamente el total de la venta.
- Registrar qué usuario realizó la operación.
- Actualizar el stock de los productos vendidos.

### Estadísticas

- Consultar información generada a partir de las ventas registradas.
- Consultar estadísticas correspondientes a distintos períodos.
- Visualizar productos que tengan poco stock.

Entre los indicadores iniciales se mostrarán la cantidad de ventas, facturación, producto más vendido, producto con mayor facturación y producto con mayor ganancia.

## Tecnologías

El stack tecnológico definido inicialmente para el proyecto es:

### Frontend

- React
- TypeScript

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

## Alcance del MVP

La primera versión del sistema estará centrada en:

- Gestión y autenticación de usuarios.
- Roles y permisos.
- Gestión de productos.
- Control y actualización de stock.
- Registro de ventas.
- Consulta de estadísticas sobre ventas, facturación, productos y stock.

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

## Estructura del repositorio

Todo el proyecto se desarrollará y mantendrá dentro de este repositorio.

La estructura inicial será la siguiente:

```text
UTN-TFI/
│
├── frontend/          # Aplicación frontend desarrollada con React y TypeScript
├── backend/           # API y lógica de negocio desarrollada con Spring Boot
├── database/          # Scripts y archivos relacionados con la base de datos
├── docs/              # Documentación del proyecto
│
└── README.md          # Presentación general del proyecto
