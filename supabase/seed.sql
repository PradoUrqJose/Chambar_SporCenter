-- ============================================================
-- SCBox — Datos de DESARROLLO
-- Este archivo solo se ejecuta en la base de datos local
-- (`supabase db reset`). NUNCA se aplica a producción con
-- `supabase db push`, así que producción nace limpia.
-- ============================================================

-- Empresas ficticias (el trigger empresas_crear_caja les crea su caja
-- de empresa automáticamente; la caja de organización nace por la
-- migración de reestructuración, no hace falta sembrarla aquí)
insert into public.empresas (id, nombre, ruc, color) values
  ('11111111-1111-1111-1111-111111111111', 'Empresa Demo Uno', '20100000001', '#0ea5e9'),
  ('22222222-2222-2222-2222-222222222222', 'Empresa Demo Dos', '20100000002', '#f59e0b');

-- Stands: registrados bajo cada empresa, sin caja propia
insert into public.stands (id, empresa_id, nombre) values
  ('aaaa1111-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Stand Plaza Norte'),
  ('aaaa1111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Stand Mega Plaza'),
  ('bbbb2222-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Stand Jockey');

-- Categorías de PRUEBA (el catálogo real de producción empieza vacío
-- y lo crea el admin desde el panel)
insert into public.categorias (nombre, tipo, descripcion) values
  ('Venta diaria (prueba)',          'ingreso', 'Categoría de prueba para desarrollo'),
  ('Otros ingresos (prueba)',        'ingreso', 'Categoría de prueba para desarrollo'),
  ('Compra de Mercadería (prueba)',  'egreso',  'Categoría de prueba para desarrollo'),
  ('Pago de servicios (prueba)',     'egreso',  'Categoría de prueba para desarrollo');

-- Nota: los usuarios no se pueden sembrar aquí (viven en auth.users).
-- En desarrollo se crean desde Supabase Studio local (Add user) y el
-- trigger handle_new_user crea su perfil; josepu03@gmail.com nace admin.
