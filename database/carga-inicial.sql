BEGIN;

SET LOCAL TIME ZONE 'America/Argentina/Buenos_Aires';
SET LOCAL lock_timeout = '5s';

CREATE TEMP TABLE carga_catalogo (
    nombre text PRIMARY KEY,
    categoria text NOT NULL,
    etiqueta text NOT NULL,
    precio numeric(10, 2) NOT NULL,
    costo numeric(10, 2) NOT NULL,
    stock integer NOT NULL,
    minimo integer NOT NULL
) ON COMMIT DROP;

INSERT INTO pg_temp.carga_catalogo VALUES
    ('Agua Villavicencio sin gas 500 ml', 'Bebidas', U&'Reposici\00F3n', 1400, 850, 45, 30),
    ('Agua Villavicencio con gas 1,5 L', 'Bebidas', 'Familiar', 2100, 1250, 70, 8),
    ('Jugo Cepita del Valle naranja 1 L', 'Bebidas', 'Popular', 3300, 2110, 65, 7),
    ('Coca-Cola Original 2,25 L', 'Bebidas', 'Familiar', 4600, 3100, 72, 12),
    ('Arroz Gallo largo fino 1 kg', 'Despensa', 'Popular', 2900, 1930, 78, 12),
    (U&'Fideos Matarazzo Tirabuz\00F3n 500 g', 'Despensa', 'Oferta', 1750, 1040, 64, 10),
    ('Aceite de girasol Natura 900 ml', 'Despensa', 'Popular', 5300, 4020, 67, 8),
    (U&'Pur\00E9 de tomate Arcor 520 g', 'Despensa', 'Oferta', 2300, 1520, 60, 7),
    ('Yerba mate Playadito 500 g', 'Desayuno', 'Popular', 4800, 3480, 84, 12),
    (U&'Dulce de leche La Seren\00EDsima Cl\00E1sico 400 g', 'Desayuno', 'Premium', 4200, 2860, 59, 6),
    (U&'Leche entera La Seren\00EDsima 1 L', 'Desayuno', 'Popular', 2400, 1740, 85, 15),
    ('Galletitas Granix Frutigran Avena y Pasas 250 g', 'Desayuno', 'Nuevo', 2800, 1610, 63, 7),
    ('Detergente Magistral 500 ml', 'Limpieza', 'Oferta', 2600, 1650, 62, 8),
    (U&'Lavandina Ayud\00EDn Esencial 1 L', 'Limpieza', 'Familiar', 1900, 1220, 71, 10),
    (U&'Limpiador de pisos Poett Alegra tu D\00EDa 900 ml', 'Limpieza', 'Nuevo', 3700, 2440, 58, 6),
    (U&'Rollos de cocina Sussex Cl\00E1sico 3 unidades', 'Limpieza', U&'Reposici\00F3n', 3100, 2090, 48, 39),
    ('Shampoo Sedal Balance Hidratante 340 ml', 'Cuidado personal', 'Premium', 6900, 4500, 52, 5),
    (U&'Pasta dental Colgate Triple Acci\00F3n 90 g', 'Cuidado personal', 'Popular', 3500, 2320, 62, 7),
    (U&'Jab\00F3n l\00EDquido Dove Piel Sensible 250 ml', 'Cuidado personal', 'Nuevo', 4100, 2630, 53, 5),
    ('Cepillo dental Oral-B Indicator', 'Cuidado personal', 'Individual', 2900, 1600, 55, 6),
    (U&'Papas fritas Lay''s Cl\00E1sicas 85 g', 'Snacks', 'Individual', 3100, 1830, 68, 9),
    (U&'Alfajor Guaymall\00E9n triple de chocolate 70 g', 'Snacks', 'Popular', 1900, 1020, 83, 12),
    (U&'Man\00ED salado Man\00ED King 100 g', 'Snacks', 'Oferta', 2600, 1480, 60, 7),
    ('Chocolate Milka con almendras 80 g', 'Snacks', 'Premium', 5600, 3440, 57, 6);

LOCK TABLE public.categories, public.tags, public.products
    IN SHARE ROW EXCLUSIVE MODE;

DO $$
DECLARE
    v_ahora timestamptz := NOW();
    v_hoy date := v_ahora::date;
    v_desde date := (v_ahora - INTERVAL '2 months')::date;
    v_alta timestamptz := (v_desde - 1)::timestamptz;
    v_coincidencias integer;
    v_admin_id integer;
    v_proximo_numero bigint;
    v_productos integer[];
    v_items integer[];
    v_venta record;
    v_venta_id integer;
    v_n integer := 0;
    v_anuladas integer := 0;
    v_anulada boolean;
    v_total numeric(10, 2);
    v_medios public.payment_method[] :=
        ARRAY['cash', 'transfer', 'card', 'other']::public.payment_method[];
BEGIN
    SELECT COUNT(*) INTO v_coincidencias
    FROM pg_temp.carga_catalogo AS d
    WHERE EXISTS (
        SELECT 1
        FROM public.products AS p
        WHERE lower(p.name) = lower(d.nombre)
    );

    IF v_coincidencias = 24 THEN
        RAISE NOTICE 'Los 24 productos del catalogo ya existen. No se agregaron registros.';
        RETURN;
    ELSIF v_coincidencias > 0 THEN
        RAISE EXCEPTION 'Parte del catalogo ya existe. No se sobrescribieron registros.';
    END IF;

    SELECT id INTO v_admin_id
    FROM public.users
    WHERE role = 'admin' AND is_active
    ORDER BY id
    LIMIT 1;

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'La carga requiere un administrador activo existente.';
    END IF;

    SELECT last_value + CASE WHEN is_called THEN 1 ELSE 0 END
    INTO v_proximo_numero
    FROM public.sale_number_seq;

    IF v_proximo_numero <= (SELECT COALESCE(MAX(number), 0) FROM public.sales) THEN
        RAISE EXCEPTION 'La secuencia de ventas esta atrasada. No se cargo el catalogo.';
    END IF;

    INSERT INTO public.categories (name, created_at, updated_at)
    SELECT DISTINCT d.categoria, v_alta, v_alta
    FROM pg_temp.carga_catalogo AS d
    WHERE NOT EXISTS (
        SELECT 1 FROM public.categories AS c WHERE lower(c.name) = lower(d.categoria)
    );

    INSERT INTO public.tags (name, color, created_at, updated_at)
    SELECT t.nombre, t.color, v_alta, v_alta
    FROM (VALUES
        (U&'Reposici\00F3n', '#DC2626'),
        ('Familiar', '#16A34A'),
        ('Popular', '#2563EB'),
        ('Oferta', '#EA580C'),
        ('Premium', '#7C3AED'),
        ('Nuevo', '#DB2777'),
        ('Individual', '#0891B2')
    ) AS t(nombre, color)
    WHERE NOT EXISTS (
        SELECT 1 FROM public.tags AS x WHERE lower(x.name) = lower(t.nombre)
    );

    IF EXISTS (
        SELECT 1
        FROM pg_temp.carga_catalogo AS d
        WHERE (
            SELECT COUNT(*) FROM public.categories AS c
            WHERE lower(c.name) = lower(d.categoria) AND c.is_active
        ) <> 1 OR (
            SELECT COUNT(*) FROM public.tags AS t
            WHERE lower(t.name) = lower(d.etiqueta) AND t.is_active
        ) <> 1
    ) THEN
        RAISE EXCEPTION 'Hay categorias o etiquetas inactivas o duplicadas.';
    END IF;

    WITH nuevos AS (
        INSERT INTO public.products (
            category_id, name, price, cost, stock, min_stock, created_at, updated_at
        )
        SELECT c.id, d.nombre, d.precio, d.costo, d.stock, d.minimo, v_alta, v_alta
        FROM pg_temp.carga_catalogo AS d
        JOIN public.categories AS c ON lower(c.name) = lower(d.categoria) AND c.is_active
        RETURNING id, name
    )
    INSERT INTO public.product_tags (product_id, tag_id)
    SELECT p.id, t.id
    FROM nuevos AS p
    JOIN pg_temp.carga_catalogo AS d ON d.nombre = p.name
    JOIN public.tags AS t ON lower(t.name) = lower(d.etiqueta) AND t.is_active;

    SELECT array_agg(p.id ORDER BY p.name COLLATE "C") INTO v_productos
    FROM public.products AS p
    JOIN pg_temp.carga_catalogo AS d ON d.nombre = p.name;

    IF cardinality(v_productos) IS DISTINCT FROM 24 THEN
        RAISE EXCEPTION 'No se cargaron los 24 productos.';
    END IF;

    FOR v_venta IN
        SELECT LEAST(
            (v_desde + d.dia + CASE WHEN t.turno = 1
                THEN TIME '11:15' ELSE TIME '17:40' END)::timestamptz,
            v_ahora
        ) AS fecha
        FROM generate_series(0, v_hoy - v_desde) AS d(dia)
        CROSS JOIN (VALUES (1), (2)) AS t(turno)
        WHERE t.turno = 1 OR (d.dia % 2 = 0 AND v_desde + d.dia < v_hoy)
        ORDER BY d.dia, t.turno
    LOOP
        v_n := v_n + 1;

        v_items := ARRAY[
            v_productos[1 + ((v_n - 1) * 5) % 24],
            v_productos[1 + ((v_n - 1) * 5 + 7) % 24]
        ];

        IF v_n % 4 = 0 THEN
            v_items := array_append(v_items, v_productos[1 + ((v_n - 1) * 5 + 15) % 24]);
        END IF;

        v_anulada := v_n % 11 = 0 AND v_venta.fecha::date < v_hoy;

        SELECT SUM(p.price * (1 + (v_n + i.pos::integer) % 3)) INTO v_total
        FROM unnest(v_items) WITH ORDINALITY AS i(product_id, pos)
        JOIN public.products AS p ON p.id = i.product_id;

        INSERT INTO public.sales (
            user_id, number, payment_method, total, status, created_at,
            cancelled_at, cancelled_by, cancellation_reason
        )
        VALUES (
            v_admin_id, nextval('public.sale_number_seq'),
            v_medios[1 + (v_n - 1) % 4], v_total,
            CASE WHEN v_anulada THEN 'cancelled'::public.sale_status
                 ELSE 'completed'::public.sale_status END,
            v_venta.fecha,
            CASE WHEN v_anulada THEN v_venta.fecha + INTERVAL '45 minutes' END,
            CASE WHEN v_anulada THEN v_admin_id END,
            CASE WHEN v_anulada THEN
                CASE WHEN v_n % 2 = 0 THEN U&'El cliente desisti\00F3 de la compra'
                     ELSE 'Error al registrar el pedido' END
            END
        )
        RETURNING id INTO v_venta_id;

        INSERT INTO public.sale_products (
            sale_id, product_id, product_name, quantity, unit_price, unit_cost, subtotal
        )
        SELECT v_venta_id, p.id, p.name, 1 + (v_n + i.pos::integer) % 3,
               p.price, p.cost, p.price * (1 + (v_n + i.pos::integer) % 3)
        FROM unnest(v_items) WITH ORDINALITY AS i(product_id, pos)
        JOIN public.products AS p ON p.id = i.product_id;

        IF v_anulada THEN
            v_anuladas := v_anuladas + 1;
        ELSE
            UPDATE public.products AS p
            SET stock = p.stock - sp.quantity
            FROM public.sale_products AS sp
            WHERE sp.sale_id = v_venta_id AND sp.product_id = p.id;
        END IF;
    END LOOP;

    RAISE NOTICE 'Carga inicial completada: 24 productos, % ventas completadas y % anuladas.',
        v_n - v_anuladas, v_anuladas;
END;
$$;

COMMIT;