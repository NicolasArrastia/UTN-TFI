# 14. Definición de requisitos

## 14.1 Introducción

La definición de requisitos establece las necesidades y condiciones que debe cumplir el sistema de gestión para pequeños comercios.

Los requisitos se obtuvieron a partir del problema identificado, el relevamiento realizado y las funcionalidades definidas para el MVP. Se dividen en requisitos funcionales, requisitos no funcionales y reglas de negocio.

El objetivo es establecer claramente qué debe hacer el sistema y qué características debe cumplir, independientemente de la tecnología utilizada para implementarlo.

---

## 14.2 Actores del sistema

El sistema contempla principalmente dos tipos de usuarios:

| Actor         | Descripción                                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Administrador | Usuario con acceso a la gestión general del negocio, usuarios, productos y estadísticas.                                                    |
| Empleado      | Usuario que puede realizar las operaciones permitidas por el administrador, principalmente relacionadas con ventas y consulta de productos. |

Cada usuario pertenece a un negocio determinado. Esto permite mantener separados los datos de diferentes negocios.

---

# 14.3 Requisitos funcionales

## RF-01 - Registro de usuario

El sistema deberá permitir registrar nuevos usuarios asociados a un negocio.

**Datos principales:**

* Nombre.
* Usuario.
* Contraseña.
* Rol.
* Negocio al que pertenece.

El registro deberá validar que los datos obligatorios estén completos.

---

## RF-02 - Inicio de sesión

El sistema deberá permitir que un usuario registrado inicie sesión utilizando sus credenciales.

El sistema deberá verificar las credenciales y, si son correctas, generar un token JWT para autenticar las solicitudes posteriores.

---

## RF-03 - Autenticación mediante JWT

El sistema deberá utilizar tokens JWT para identificar y autenticar a los usuarios.

Las operaciones que requieran autenticación no deberán estar disponibles para usuarios que no hayan iniciado sesión.

---

## RF-04 - Gestión de roles

El sistema deberá diferenciar los permisos de los usuarios según su rol.

Se contemplan inicialmente los siguientes roles:

* Administrador.
* Empleado.

El sistema deberá verificar el rol antes de permitir operaciones que requieran permisos específicos.

---

## RF-05 - Gestión de múltiples usuarios

El sistema deberá permitir que un mismo negocio tenga múltiples usuarios.

Cada usuario deberá estar asociado a un único negocio dentro del sistema.

---

## RF-06 - Gestión de productos

El sistema deberá permitir administrar los productos del negocio.

Las operaciones principales serán:

* Crear productos.
* Consultar productos.
* Modificar productos.
* Desactivar productos.
* Consultar stock.
* Definir precio de venta.
* Definir costo.
* Definir stock actual.
* Definir stock mínimo.

---

## RF-07 - Gestión de categorías

El sistema deberá permitir crear y administrar categorías para organizar los productos.

Un producto podrá estar asociado a una categoría.

---

## RF-08 - Gestión de etiquetas

El sistema deberá permitir crear y administrar etiquetas para clasificar productos.

Un producto podrá tener múltiples etiquetas.

Las etiquetas podrán almacenar información como:

* Nombre.
* Color.

---

## RF-09 - Registro de ventas

El sistema deberá permitir registrar las ventas realizadas por el negocio.

Cada venta deberá almacenar como mínimo:

* Fecha y hora.
* Usuario que realizó la venta.
* Productos vendidos.
* Cantidad de cada producto.
* Precio unitario.
* Subtotal.
* Total de la venta.
* Método de pago.
* Estado de la venta.

---

## RF-10 - Métodos de pago

El sistema deberá permitir registrar el método de pago utilizado en una venta.

Los métodos contemplados inicialmente son:

* Efectivo.
* Transferencia.
* Tarjeta.
* Otro.

---

## RF-11 - Actualización del stock

Al registrar una venta, el sistema deberá actualizar el stock de los productos vendidos.

La cantidad disponible deberá disminuir de acuerdo con las unidades vendidas.

---

## RF-12 - Control de stock mínimo

El sistema deberá permitir establecer un stock mínimo para cada producto.

Cuando el stock actual sea igual o inferior al stock mínimo establecido, el sistema podrá identificar el producto como un producto que requiere reposición.

---

## RF-13 - Consulta de estadísticas

El sistema deberá proporcionar información estadística sobre las ventas realizadas.

Entre las estadísticas contempladas se encuentran:

* Producto más vendido.
* Productos con mayor cantidad de ventas.
* Ingresos generados.
* Rentabilidad o retorno de los productos.

Estas estadísticas deberán utilizar la información almacenada en las ventas.

---

## RF-14 - Asociación de información al negocio

Los datos generados por los usuarios deberán estar asociados al negocio correspondiente.

Esto incluye:

* Usuarios.
* Productos.
* Categorías.
* Etiquetas.
* Ventas.

De esta manera, un negocio no deberá acceder a la información perteneciente a otro negocio.

---

## RF-15 - Desactivación de registros

El sistema deberá permitir desactivar determinados registros sin eliminarlos físicamente de la base de datos cuando corresponda.

Para estos casos se utilizará un estado lógico, como `isDeleted` o `status`.

Esto permitirá conservar la información histórica necesaria para las operaciones y estadísticas.

---

## RF-16 - Control de acceso

El sistema deberá verificar que el usuario tenga los permisos necesarios antes de ejecutar operaciones restringidas.

Por ejemplo, las operaciones de administración de usuarios deberán estar disponibles únicamente para usuarios con los permisos correspondientes.

---

# 14.4 Requisitos no funcionales

## RNF-01 - Seguridad

El sistema deberá proteger las operaciones que requieran autenticación y autorización.

Las contraseñas no deberán almacenarse de forma directa en texto plano en una implementación real.

---

## RNF-02 - Protección de datos entre negocios

El sistema deberá garantizar el aislamiento de la información entre diferentes negocios.

Un usuario solamente deberá poder consultar y modificar información correspondiente al negocio al que pertenece.

---

## RNF-03 - Usabilidad

La interfaz deberá ser clara y sencilla, permitiendo que un usuario pueda realizar las operaciones principales sin conocimientos técnicos.

---

## RNF-04 - Rendimiento

Las operaciones habituales, como consultar productos, registrar ventas y consultar información básica, deberán ejecutarse en tiempos adecuados para el uso cotidiano del sistema.

---

## RNF-05 - Disponibilidad

La aplicación deberá poder ser utilizada mediante Internet desde un navegador web, considerando la infraestructura de despliegue definida para el proyecto.

---

## RNF-06 - Mantenibilidad

El código deberá organizarse de forma modular para facilitar la incorporación de nuevas funcionalidades y el mantenimiento del sistema.

El backend seguirá una arquitectura de tres capas:

1. Presentación/API.
2. Lógica de negocio.
3. Acceso a datos.

---

## RNF-07 - Escalabilidad

La arquitectura deberá permitir incorporar nuevos usuarios, productos, ventas y funcionalidades sin necesidad de modificar completamente la estructura del sistema.

---

## RNF-08 - Compatibilidad

La aplicación deberá funcionar en navegadores web modernos y adaptarse a las resoluciones de pantalla utilizadas habitualmente para acceder al sistema.

---

# 14.5 Reglas de negocio

## RN-01 - Asociación de usuarios

Todo usuario deberá pertenecer a un negocio.

---

## RN-02 - Roles

Cada usuario deberá tener un rol que determine las operaciones que puede realizar.

---

## RN-03 - Productos

Cada producto deberá pertenecer a un negocio y podrá estar asociado a una categoría y a múltiples etiquetas.

---

## RN-04 - Ventas

Cada venta deberá estar asociada a un usuario y a un negocio.

---

## RN-05 - Detalle de venta

Una venta podrá contener uno o varios productos.

Cada elemento del detalle deberá registrar la cantidad y el precio utilizado en el momento de la venta.

---

## RN-06 - Total de venta

El total de una venta deberá corresponder a la suma de los subtotales de los productos incluidos en el detalle.

**Fórmula conceptual:**

`Total = Σ (cantidad × precio unitario)`

---

## RN-07 - Stock

No se deberá permitir registrar una venta de una cantidad superior al stock disponible del producto, salvo que posteriormente se defina explícitamente el manejo de stock negativo.

---

## RN-08 - Estado de las ventas

Las ventas deberán conservar un estado que permita diferenciar, como mínimo:

* `completed`: venta completada.
* `voided`: venta anulada.

---

## RN-09 - Métodos de pago

Una venta deberá registrar uno de los métodos de pago disponibles en el sistema.

---

## RN-10 - Aislamiento de información

Un usuario no deberá poder acceder a productos, ventas, usuarios, categorías o etiquetas pertenecientes a otro negocio.

---

# 14.6 Matriz de requisitos y módulos

| Requisito                    | Módulo                                       |
| ---------------------------- | -------------------------------------------- |
| RF-01 Registro de usuario    | Autenticación y usuarios                     |
| RF-02 Inicio de sesión       | Autenticación y usuarios                     |
| RF-03 JWT                    | Autenticación y usuarios                     |
| RF-04 Roles                  | Autenticación y usuarios                     |
| RF-05 Múltiples usuarios     | Autenticación y usuarios                     |
| RF-06 Productos              | Productos                                    |
| RF-07 Categorías             | Categorías y etiquetas                       |
| RF-08 Etiquetas              | Categorías y etiquetas                       |
| RF-09 Registro de ventas     | Ventas                                       |
| RF-10 Métodos de pago        | Ventas                                       |
| RF-11 Actualización de stock | Ventas / Productos                           |
| RF-12 Stock mínimo           | Productos                                    |
| RF-13 Estadísticas           | Estadísticas                                 |
| RF-14 Asociación al negocio  | Autenticación y usuarios / todos los módulos |
| RF-15 Desactivación          | Productos / Usuarios                         |
| RF-16 Control de acceso      | Autenticación y usuarios                     |

---

# 14.7 Priorización para el MVP

Para mantener el alcance controlado, los requisitos se pueden implementar de manera progresiva.

### Prioridad alta

* RF-02 - Inicio de sesión.
* RF-03 - Autenticación JWT.
* RF-04 - Roles.
* RF-06 - Gestión de productos.
* RF-09 - Registro de ventas.
* RF-11 - Actualización del stock.
* RF-14 - Asociación al negocio.
* RF-16 - Control de acceso.

### Prioridad media

* RF-01 - Registro de usuarios.
* RF-07 - Categorías.
* RF-08 - Etiquetas.
* RF-10 - Métodos de pago.
* RF-12 - Stock mínimo.
* RF-15 - Desactivación de registros.

### Prioridad posterior

* RF-13 - Estadísticas avanzadas.

La priorización permite construir primero el núcleo operativo del sistema y posteriormente incorporar funciones de análisis y mejoras.

---

# 14.8 Relación entre requisitos y arquitectura

Los requisitos funcionales serán implementados mediante los módulos definidos en el sistema, mientras que los requisitos no funcionales condicionarán la arquitectura y las decisiones técnicas.

Por ejemplo:

* La autenticación y los roles requieren mecanismos de JWT y autorización.
* La separación de información entre negocios requiere validar el `businessId` en las operaciones correspondientes.
* La gestión de productos y ventas requiere comunicación entre la API, la lógica de negocio y la base de datos.
* Las estadísticas utilizarán la información registrada en las ventas.
* La mantenibilidad se abordará mediante una arquitectura organizada en tres capas.

Por lo tanto, la definición de requisitos sirve como vínculo entre el problema identificado, el alcance del MVP, la arquitectura y los módulos que serán implementados.
