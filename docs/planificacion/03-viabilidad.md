# 9. Viabilidad

## 9.1 Viabilidad técnica

El proyecto es técnicamente viable porque las funcionalidades del MVP pueden desarrollarse utilizando tecnologías conocidas por el equipo.

Se utilizarán React con TypeScript para el frontend y Node.js con Express y TypeScript para el backend. La información se almacenará en PostgreSQL, alojado en Neon. Para identificar a los usuarios se utilizará JWT, junto con controles de autorización para determinar qué operaciones puede realizar cada uno.

Los principales puntos de dificultad identificados son:

- Autenticación y autorización.
- Integración frontend/backend.
- Generación de estadísticas.

Estos puntos serán trabajados progresivamente.

## 9.2 Viabilidad económica

El proyecto utiliza principalmente tecnologías y herramientas que no requieren costos de licencia para el desarrollo académico:

- React.
- Node.js.
- Express.
- PostgreSQL.
- Git.
- GitHub.

Render se plantea inicialmente como alternativa para el despliegue del backend y Vercel para el frontend.

Para alojar la base de datos utilizaremos Neon. Al planificar el despliegue tendremos en cuenta los límites y las condiciones del plan elegido, para evaluar si cubre las necesidades del MVP. Si el sistema se utiliza posteriormente en un comercio real, también deberemos considerar los posibles costos de alojamiento y mantenimiento.

Por el alcance académico, no se identifica un costo económico que impida desarrollar el MVP. En un escenario real, un crecimiento importante de usuarios o datos podría requerir infraestructura con mayores recursos.

## 9.3 Viabilidad operativa

La viabilidad operativa depende de que la aplicación sea sencilla de utilizar en las tareas habituales de un pequeño comercio.

Las operaciones principales deben poder realizarse sin conocimientos técnicos:

- Registrar productos.
- Registrar ventas.
- Consultar stock.
- Consultar estadísticas.

El MVP se concentra en operaciones comunes para evitar depender de procesos específicos de un tipo de comercio.

La utilización con comercios reales permitiría validar posteriormente la facilidad de uso y detectar mejoras.

## 9.4 Viabilidad temporal

El desarrollo se organiza de acuerdo con las fechas de la cátedra.

El objetivo es completar el diseño de arquitectura y módulos antes del 27/09, desarrollar la base del sistema durante octubre, llegar al 01/11 con las funcionalidades principales y estadísticas integradas, utilizar del 02/11 al 08/11 para pruebas y correcciones, y reservar del 09/11 al 14/11 para despliegue y entrega final.

La viabilidad temporal depende de mantener el alcance del MVP y revisar periódicamente el avance.
