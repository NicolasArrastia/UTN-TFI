# 9. Viabilidad

Las viabilidades prioritarias para el proyecto son la técnica, la temporal y la de conocimiento del negocio. Las tres condicionan el alcance del MVP. La económica y la operativa se revisan después porque dependen de decisiones que ya tomamos sobre tecnologías y forma de trabajo.

## 9.1 Viabilidad técnica

El proyecto es técnicamente viable porque las funcionalidades del MVP pueden desarrollarse utilizando tecnologías conocidas por el equipo.

Se utilizarán React con TypeScript para el frontend y Node.js con Express y TypeScript para el backend. La información se almacenará en PostgreSQL, alojado en Neon. Para identificar a los usuarios se utilizará JWT, junto con controles de autorización para determinar qué operaciones puede realizar cada uno.

Los principales puntos de dificultad identificados son:

- Autenticación y autorización.
- Integración frontend/backend.
- Generación de estadísticas.

La autenticación ya está implementada en la API y el equipo la usó en las pruebas de productos. La integración del frontend de productos también quedó resuelta. La generación de estadísticas sigue siendo el punto con más incertidumbre, porque requiere consultas que combinan ventas, detalle y productos.

## 9.2 Viabilidad temporal

El desarrollo se organiza de acuerdo con las fechas de la cátedra.

El objetivo es completar el diseño de arquitectura y módulos antes del 27/09, desarrollar la base del sistema durante octubre, llegar al 01/11 con las funcionalidades principales y estadísticas integradas, utilizar del 02/11 al 08/11 para pruebas y correcciones, y reservar del 09/11 al 14/11 para despliegue y entrega final.

La viabilidad temporal depende de mantener el alcance del MVP y revisar periódicamente el avance.

## 9.3 Viabilidad de conocimiento del negocio

El relevamiento nos permitió entender cómo trabajan tres tipos de comercio: un mini mercado, una panadería y una carnicería. Sabemos que las ventas se registran en papel o con una registradora que guarda la fecha y el monto, que los precios se consultan en hojas o se conocen de memoria, y que en el mini mercado se usan balanzas y calculadora. También vimos que ninguna de esas formas deja el detalle de los productos vendidos.

Lo que no conocemos en profundidad es la venta por peso, la gestión de proveedores y compras, y la operación con varios puestos de cobro. El relevamiento mostró balanzas en el mini mercado y registros manuales en la carnicería, pero no estudiamos cómo se fraccionan los productos ni cómo se repone el stock. Tampoco relevamos cómo se coordinan dos personas cobrando al mismo tiempo.

Esas ausencias se reflejan en el alcance: el MVP registra cantidades enteras de productos, no ventas por peso; no incluye proveedores ni compras (ver [Alcance del MVP](../analisis/05-alcance-mvp.md)); y permite varios usuarios sobre la misma información, pero no separa cajas ni turnos. Si el sistema se llevara a un comercio que trabaja de otra forma, primero habría que relevar esos procesos y ajustar el modelo.

## 9.4 Viabilidad económica

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

## 9.5 Viabilidad operativa

La viabilidad operativa depende de que la aplicación sea sencilla de utilizar en las tareas habituales de un pequeño comercio.

Las operaciones principales deben poder realizarse sin conocimientos técnicos:

- Registrar productos.
- Registrar ventas.
- Consultar stock.
- Consultar estadísticas.

El MVP se concentra en operaciones comunes para evitar depender de procesos específicos de un tipo de comercio.

La utilización con comercios reales permitiría validar posteriormente la facilidad de uso y detectar mejoras.
