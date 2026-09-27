# 8.3 Cambio de stack: de MERN a PERN

## Contexto

Inicialmente el proyecto se había definido con un stack MERN, utilizando MongoDB como base de datos. MongoDB se había elegido por su flexibilidad para almacenar información sin necesidad de definir un esquema previo, y porque las ventas podían contener su propio detalle de productos dentro del mismo documento.

Si bien la elección era viable, el equipo ya identificaba que probablemente no se trataba de la opción más adecuada para las características del proyecto.

Al revisar nuevamente la arquitectura, y aprovechando que el desarrollo todavía no había comenzado, se decidió modificar la base de datos elegida.

## Decisión

Se reemplaza MongoDB por PostgreSQL. Con ese cambio, el stack pasa de MERN a PERN: React con TypeScript en el frontend, Node.js con Express en el backend, PostgreSQL como base de datos, API REST como mecanismo de comunicación y JWT para la autenticación.

El resto de las tecnologías del proyecto se mantiene sin cambios.

## Motivos

El primer motivo es que la información del sistema es relacional. Un negocio tiene usuarios, productos, ventas, categorías y etiquetas, y esas entidades se relacionan entre sí de manera estable. PostgreSQL representa esas relaciones de forma directa y garantiza que los datos relacionados existan.

El segundo motivo, y el más relevante para el proyecto, es que la propuesta de valor incluye generar estadísticas de ventas, facturación, productos más vendidos y control de stock a partir de las operaciones registradas. PostgreSQL se adapta mejor a ese tipo de consultas, que combinan ventas, detalle de venta y productos para obtener los indicadores que el sistema necesita mostrar.

## Alojamiento de la base de datos

Para el despliegue se eligió Neon como servicio que aloja la base de datos PostgreSQL. Se consideró esta alternativa porque permite contar con PostgreSQL sin costos de licencia ni necesidad de administrar un servidor propio, manteniendo la viabilidad económica del proyecto.

## Validación con la cátedra

El equipo consultó el cambio con la cátedra, explicando la decisión de modificar el stack, los motivos del cambio y la propuesta de utilizar Neon para el despliegue. La respuesta fue afirmativa.

El equipo realizaron el cambio en ese momento, aun cuando implicara dedicar un poco más de tiempo al desarrollo, con el objetivo de asegurarse de que la implementación final cumpla correctamente con las expectativas y los requisitos del proyecto.

## Alcance del cambio

El cambio se definió antes de comenzar el desarrollo, por lo que no implicó migrar código ni datos almacenados. Sí requiere actualizar la documentación del proyecto, en particular el stack tecnológico, la arquitectura del sistema, el modelo de datos, la viabilidad y los riesgos.
