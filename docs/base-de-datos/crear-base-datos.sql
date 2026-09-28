-- =============================================================================
-- Creación de la base de datos y del esquema
-- =============================================================================
--
-- Proyecto : Trabajo Final Integrador - Sistema de gestión comercial
-- Motor    : PostgreSQL
-- Origen   : este script es la traducción a SQL del modelo definido en
--            docs/base-de-datos/dbml.dbml
-- Documento: docs/base-de-datos/01-modelo-relacional.md
--
-- -----------------------------------------------------------------------------
-- Instrucciones de uso
-- -----------------------------------------------------------------------------
--
-- El script está pensado para poder ejecutarse más de una vez sin romper nada:
-- todas las construcciones usan IF NOT EXISTS o están controladas dentro de un
-- bloque DO que verifica si el objeto ya existe. Si la base ya está creada y
-- tiene el esquema aplicado, volver a correrlo no produce errores ni modifica
-- los datos existentes.
--
-- Hay una única excepción, indicada en el Paso 1, porque PostgreSQL no permite
-- crear una base de datos dentro de una transacción ni de forma condicional.
--
-- Para aplicarlo con psql:
--
--   psql -U <usuario> -h <host> -f crear-base-datos.sql
--
-- En Neon, el host es el que aparece en la cadena de conexión del panel del
-- proyecto y el usuario es el que se haya configurado al crearlo.
--
-- -----------------------------------------------------------------------------
-- Paso 1: crear la base de datos
-- -----------------------------------------------------------------------------
--
-- Este paso se ejecuta una sola vez, sobre el servidor y no sobre una base
-- concreta. Por eso va fuera del resto del script.
--
--   CREATE DATABASE utn_tfi;
--
-- Si la base ya existe, este comando va a fallar con un error que dice que la
-- base de datos ya existe. Es esperable y no requiere ninguna acción.
--
-- A partir de acá, todas las secciones siguientes se ejecutan dentro de la
-- base creada.
--


-- =============================================================================
-- 1. Tipos enumerados
-- =============================================================================
--
-- Los valores posibles de rol, estado de venta y medio de pago se definen como
-- tipos enumerados y no como texto libre. De esta forma el motor rechaza
-- cualquier valor que no esté en la lista, en lugar de dejarlo pasar y que el
-- error aparezca más adelante en la aplicación.
--

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'employee');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sale_status') THEN
        CREATE TYPE sale_status AS ENUM ('completed', 'cancelled');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM ('cash', 'transfer', 'card', 'other');
    END IF;
END
$$;


-- =============================================================================
-- 2. Secuencias
-- =============================================================================
--
-- La numeración de ventas se genera con una secuencia y no con el
-- autoincremental de la tabla. La razón es que el identificador interno de una
-- tabla casi nunca es correlativo: si se borra un registro o se revierte una
-- transacción, el identificador salta valores. La numeración de una venta
-- necesita ser limpia, correlativa y conocida por el usuario.
--
-- Esta secuencia es la que la capa de acceso a datos consume al registrar una
-- venta. Ver la sección de numeración en 01-modelo-relacional.md.
--

CREATE SEQUENCE IF NOT EXISTS sale_number_seq START 1;


-- =============================================================================
-- 3. Tablas
-- =============================================================================
--
-- Se crean en el orden en que se referencian entre sí para que las claves
-- foráneas puedan declararse en la propia definición de la tabla.
--

-- -----------------------------------------------------------------------------
-- 3.1 users
-- -----------------------------------------------------------------------------
-- Usuarios que operan el sistema. El comercio puede tener varios usuarios y
-- cada uno opera según lo que su rol le permita.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id         SERIAL       PRIMARY KEY,
    fullname   VARCHAR(100) NOT NULL,
    username   VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL,
    password   VARCHAR(255) NOT NULL,
    role       user_role    NOT NULL,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email    UNIQUE (email)
);

COMMENT ON COLUMN users.password IS 'Hash de la contraseña. Nunca se almacena en texto plano.';


-- -----------------------------------------------------------------------------
-- 3.2 categories
-- -----------------------------------------------------------------------------
-- Clasificación principal de los productos. Un producto pertenece a una única
-- categoría, por eso la relación es de varios a uno.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL       PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_categories_name UNIQUE (name)
);


-- -----------------------------------------------------------------------------
-- 3.3 tags
-- -----------------------------------------------------------------------------
-- Clasificación secundaria de los productos. Un producto puede tener varias
-- etiquetas, por eso la relación se resuelve con la tabla product_tags.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tags (
    id         SERIAL       PRIMARY KEY,
    name       VARCHAR(50)  NOT NULL,
    color      VARCHAR(8)   NOT NULL,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_tags_name UNIQUE (name)
);

COMMENT ON COLUMN tags.color IS 'Color de la etiqueta en formato hexadecimal, por ejemplo #FF5733.';


-- -----------------------------------------------------------------------------
-- 3.4 products
-- -----------------------------------------------------------------------------
-- Entidad central del sistema. Participa de la venta, del control de stock y
-- del cálculo de las estadísticas.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS products (
    id          SERIAL        PRIMARY KEY,
    category_id INTEGER       NOT NULL,
    name        VARCHAR(150)  NOT NULL,
    description TEXT,
    price       NUMERIC(10,2) NOT NULL,
    cost        NUMERIC(10,2) NOT NULL,
    stock       INTEGER       NOT NULL DEFAULT 0,
    min_stock   INTEGER       NOT NULL DEFAULT 0,
    is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

COMMENT ON COLUMN products.min_stock IS 'Umbral a partir del cual se informa que el producto necesita reposición.';


-- -----------------------------------------------------------------------------
-- 3.5 product_tags
-- -----------------------------------------------------------------------------
-- Tabla de relación entre productos y etiquetas. Resuelve la relación de
-- varios a varios entre ambas entidades.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS product_tags (
    product_id INTEGER NOT NULL,
    tag_id     INTEGER NOT NULL,

    CONSTRAINT pk_product_tags PRIMARY KEY (product_id, tag_id),

    CONSTRAINT fk_product_tags_product
        FOREIGN KEY (product_id) REFERENCES products (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_product_tags_tag
        FOREIGN KEY (tag_id) REFERENCES tags (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- -----------------------------------------------------------------------------
-- 3.6 sales
-- -----------------------------------------------------------------------------
-- Cabecera de la venta. Los productos que la componen se guardan en la tabla
-- sale_products.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sales (
    id                  SERIAL        PRIMARY KEY,
    user_id             INTEGER       NOT NULL,
    number              INTEGER       NOT NULL,
    payment_method      payment_method NOT NULL,
    total               NUMERIC(10,2) NOT NULL,
    status              sale_status   NOT NULL DEFAULT 'completed',
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    cancelled_at        TIMESTAMPTZ,
    cancelled_by        INTEGER,
    cancellation_reason TEXT,

    CONSTRAINT uq_sales_number UNIQUE (number),

    CONSTRAINT fk_sales_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_sales_cancelled_by
        FOREIGN KEY (cancelled_by) REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

COMMENT ON COLUMN sales.number IS 'Número correlativo de la venta. Se genera con la secuencia sale_number_seq.';

COMMENT ON COLUMN sales.cancelled_at IS 'Fecha de anulación. Nula mientras la venta está completada.';

COMMENT ON COLUMN sales.cancellation_reason IS 'Motivo de la anulación. Nulo mientras la venta está completada.';


-- -----------------------------------------------------------------------------
-- 3.7 sale_products
-- -----------------------------------------------------------------------------
-- Detalle de la venta: los productos que la componen y la cantidad vendida de
-- cada uno.
--
-- product_name y unit_price son copias de los valores que tenía el producto en
-- el momento de la venta. No son referencias a los valores actuales, para que
-- el historial no cambie si después se renombra un producto o se le modifica
-- el precio.
--
-- La clave primaria es compuesta por sale_id y product_id, lo que impide que
-- una misma venta tenga dos renglones del mismo producto. El backend agrupa los
-- productos repetidos antes de insertar el detalle.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sale_products (
    sale_id      INTEGER       NOT NULL,
    product_id   INTEGER       NOT NULL,
    product_name VARCHAR(150)  NOT NULL,
    quantity     INTEGER       NOT NULL,
    unit_price   NUMERIC(10,2) NOT NULL,
    subtotal     NUMERIC(10,2) NOT NULL,

    CONSTRAINT pk_sale_products PRIMARY KEY (sale_id, product_id),

    CONSTRAINT fk_sale_products_sale
        FOREIGN KEY (sale_id) REFERENCES sales (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_sale_products_product
        FOREIGN KEY (product_id) REFERENCES products (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

COMMENT ON COLUMN sale_products.product_name IS 'Copia del nombre del producto en el momento de la venta.';

COMMENT ON COLUMN sale_products.unit_price IS 'Copia del precio unitario aplicado en la venta.';

COMMENT ON COLUMN sale_products.subtotal IS 'Copia del resultado de cantidad por precio unitario. Se almacena para que el total histórico no varíe.';


-- =============================================================================
-- 4. Restricciones de verificación
-- =============================================================================
--
-- Las restricciones siguientes están declaradas dentro de un bloque DO porque
-- PostgreSQL no permite agregar restricciones con la cláusula IF NOT EXISTS
-- directamente sobre ALTER TABLE. El bloque verifica primero si la restricción
-- ya existe.
--
-- La primera de todas, chk_products_stock, es la que garantiza la regla de
-- negocio que impide vender más existencias de las disponibles. La regla se
-- verifica en la capa de negocio antes de guardar la venta, y esta restricción
-- actúa como última barrera: aunque una validación fallara, la base de datos no
-- admite un stock negativo.
--

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_price') THEN
        ALTER TABLE products ADD CONSTRAINT chk_products_price CHECK (price >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_cost') THEN
        ALTER TABLE products ADD CONSTRAINT chk_products_cost CHECK (cost >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_stock') THEN
        ALTER TABLE products ADD CONSTRAINT chk_products_stock CHECK (stock >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_min_stock') THEN
        ALTER TABLE products ADD CONSTRAINT chk_products_min_stock CHECK (min_stock >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_sales_total') THEN
        ALTER TABLE sales ADD CONSTRAINT chk_sales_total CHECK (total >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_sale_products_quantity') THEN
        ALTER TABLE sale_products ADD CONSTRAINT chk_sale_products_quantity CHECK (quantity > 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_sale_products_subtotal') THEN
        ALTER TABLE sale_products ADD CONSTRAINT chk_sale_products_subtotal CHECK (subtotal >= 0);
    END IF;
END
$$;


-- =============================================================================
-- 5. Índices
-- =============================================================================
--
-- Cada índice responde a una consulta concreta que el sistema realiza con
-- frecuencia. La justificación de cada uno está en la sección de índices de
-- docs/base-de-datos/01-modelo-relacional.md.
-- -----------------------------------------------------------------------------

-- Listado de productos: muestra siempre los activos y se ordena por nombre.
CREATE INDEX IF NOT EXISTS idx_products_active   ON products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_name     ON products (name);

-- Filtro del listado de productos por categoría.
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);

-- Historial de ventas y estadísticas por período: ambos filtran por fecha.
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales (created_at);

-- Consulta de las ventas registradas por un usuario.
CREATE INDEX IF NOT EXISTS idx_sales_user ON sales (user_id);

-- Indicadores por producto: producto más vendido, mayor facturación y mayor
-- ganancia. La clave primaria de sale_products empieza por sale_id, por lo que
-- product_id queda como segunda columna y no sirve para este tipo de búsqueda.
CREATE INDEX IF NOT EXISTS idx_sale_products_product ON sale_products (product_id);


-- =============================================================================
-- 6. Disparadores de actualización de fecha
-- =============================================================================
--
-- Las tablas que se editan durante la operación normal del sistema deben
-- actualizar su columna updated_at. En este script, que es SQL puro, eso se
-- resuelve con un disparador. La herramienta de acceso a datos resuelve el mismo
-- comportamiento por su cuenta, de modo que si más adelante las migraciones se
-- generan desde esa herramienta, esta sección deja de ser necesaria.
--
-- Las ventas no tienen disparador porque su contenido no se modifica una vez
-- registradas: solamente se anulan, y para eso existen las columnas propias de
-- anulación.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_tags_updated_at ON tags;
CREATE TRIGGER trg_tags_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- 7. Comprobación final
-- =============================================================================
--
-- La consulta siguiente devuelve una tabla por cada objeto creado y su
-- cantidad. Ejecutarla al terminar permite comprobar que el esquema quedó
-- completo antes de seguir con el desarrollo.
--
--   SELECT 'users' AS tabla, COUNT(*) FROM users
--   UNION ALL SELECT 'categories', COUNT(*) FROM categories
--   UNION ALL SELECT 'tags', COUNT(*) FROM tags
--   UNION ALL SELECT 'products', COUNT(*) FROM products
--   UNION ALL SELECT 'product_tags', COUNT(*) FROM product_tags
--   UNION ALL SELECT 'sales', COUNT(*) FROM sales
--   UNION ALL SELECT 'sale_products', COUNT(*) FROM sale_products;
--


-- =============================================================================
-- 8. Datos iniciales
-- =============================================================================
--
-- El sistema necesita al menos un usuario con rol de administrador para poder
-- iniciar sesión. Ese usuario se crea una sola vez, y el hash de la contraseña
-- debe generarse desde la aplicación, porque el algoritmo y el formato del hash
-- dependen de la librería que se use en el backend.
--
-- Insertar el hash directamente en la base de datos no es recomendable, por lo
-- que la instrucción queda comentada a propósito. Cuando exista el módulo de
-- autenticación, el alta del primer administrador se hará desde la aplicación o
-- desde un script de inicialización que use el mismo código de hash.
--
--   INSERT INTO users (fullname, username, email, password, role)
--   VALUES (
--       'Administrador',
--       'admin',
--       'admin@ejemplo.com',
--       '<hash bcrypt generado por la aplicación>',
--       'admin'
--   );
--
-- El resto de los datos son los que va registrando el usuario durante el uso
-- del sistema: categorías, etiquetas, productos y ventas. No se incluyen aquí.
-- =============================================================================
