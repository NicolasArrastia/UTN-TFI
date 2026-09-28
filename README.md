# Trabajo Integrador Final - UTN

Repositorio correspondiente al Trabajo Final Integrador de la Tecnicatura Universitaria en Programación de la Universidad Tecnológica Nacional.

- [Informe completo](https://docs.google.com/document/d/1VEmq8IQWdE1cVnLsrtFOBDiN8HbyCjLl/edit?usp=drive_link&ouid=104223395228377711470&rtpof=true&sd=true)
- [Documentación del proyecto](docs/README.md)

## Stack tecnológico

| Parte | Tecnología |
|---|---|
| Frontend | React + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Base de datos | PostgreSQL alojado en Neon, accedido con Prisma |
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
- Script de creación de la base de datos: [crear-base-datos.sql](docs/base-de-datos/crear-base-datos.sql)
