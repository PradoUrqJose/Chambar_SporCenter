-- ============================================================
-- SCBox — Reset completo de datos de negocio + datos demo nuevos
-- probando el flujo de stands (fondo fijo entregado/recibido, sin
-- caja propia por stand, sin exigir que cuadren entre sí).
--
-- ADVERTENCIA: borra TODOS los movimientos, transferencias,
-- sesiones de caja, cajas, stands, asignaciones, empresas y
-- categorías existentes. No se puede deshacer una vez aplicada
-- con `supabase db push`. Los perfiles (usuarios/auth.users) NO
-- se tocan.
-- ============================================================

-- 1) Vaciar todo lo transaccional y de catálogo (perfiles intacto).
--    Orden por las FK "on delete restrict": movimientos antes que
--    transferencias/sesiones/cajas; stands/asignaciones antes que
--    empresas.
delete from public.movimientos;
delete from public.transferencias;
delete from public.sesiones_caja;
delete from public.cajas;
delete from public.stands;
delete from public.asignaciones;
delete from public.empresas;
delete from public.categorias;

-- 2) Empresas (cada una recibe su caja automáticamente vía el
--    trigger empresas_crear_caja)
insert into public.empresas (id, nombre, ruc, color) values
  ('e1000000-0000-0000-0000-000000000001', 'Nutrisabor SAC',             '20123456781', '#7c3aed'),
  ('e1000000-0000-0000-0000-000000000002', 'Ferretería El Tornillo SRL', '20123456782', '#16a34a'),
  ('e1000000-0000-0000-0000-000000000003', 'Boutique Marea EIRL',        '20123456783', '#f97316')
on conflict (id) do nothing;

-- 3) Stands por empresa (destinos de fondo fijo, sin caja propia)
insert into public.stands (id, empresa_id, nombre) values
  ('e1000000-0000-0000-0000-000000000011', 'e1000000-0000-0000-0000-000000000001', 'Stand San Isidro'),
  ('e1000000-0000-0000-0000-000000000012', 'e1000000-0000-0000-0000-000000000001', 'Stand Miraflores'),
  ('e1000000-0000-0000-0000-000000000021', 'e1000000-0000-0000-0000-000000000002', 'Stand Independencia'),
  ('e1000000-0000-0000-0000-000000000031', 'e1000000-0000-0000-0000-000000000003', 'Stand Plaza Norte')
on conflict (id) do nothing;

-- 4) Categorías de prueba
insert into public.categorias (nombre, tipo, descripcion) values
  ('Venta diaria (prueba)',          'ingreso', 'Categoría de prueba para desarrollo'),
  ('Otros ingresos (prueba)',        'ingreso', 'Categoría de prueba para desarrollo'),
  ('Compra de Mercadería (prueba)',  'egreso',  'Categoría de prueba para desarrollo'),
  ('Pago de servicios (prueba)',     'egreso',  'Categoría de prueba para desarrollo')
on conflict (nombre, tipo) do nothing;

-- 5) Jose Urquiza (único admin_empresa hoy) queda sin empresa al
--    borrar asignaciones: se reasigna a la primera empresa nueva.
insert into public.asignaciones (usuario_id, empresa_id) values
  ('9e65263c-8d8d-46ae-8739-1653c361ce9d', 'e1000000-0000-0000-0000-000000000001')
on conflict (usuario_id, empresa_id) do nothing;

-- 6) Simular 6 días de actividad (hoy + los 5 anteriores, hora
--    Lima) por cada caja de empresa: apertura, movimientos variados
--    por categoría, fondo fijo entregado a cada stand en la mañana,
--    venta completa recibida del stand en la noche (montos
--    independientes, no tienen por qué coincidir), y cierre con
--    pequeña variación de arqueo. El día de hoy queda abierto.
do $$
declare
  v_actor          uuid := '96db3ecf-3523-4201-ba29-3db87ce6ad00'; -- Alberto Prado (admin_organizacion)
  v_hoy_lima       date := (now() at time zone 'America/Lima')::date;
  v_cat_ing1       uuid := (select id from public.categorias where nombre = 'Venta diaria (prueba)' and tipo = 'ingreso');
  v_cat_ing2       uuid := (select id from public.categorias where nombre = 'Otros ingresos (prueba)' and tipo = 'ingreso');
  v_cat_egr1       uuid := (select id from public.categorias where nombre = 'Compra de Mercadería (prueba)' and tipo = 'egreso');
  v_cat_egr2       uuid := (select id from public.categorias where nombre = 'Pago de servicios (prueba)' and tipo = 'egreso');
  v_caja_id        uuid;
  v_empresa_id     uuid;
  v_dia            date;
  v_offset         int;
  v_apertura       timestamptz;
  v_cierre         timestamptz;
  v_monto_apertura numeric(12,2);
  v_esperado       numeric(12,2);
  v_contado        numeric(12,2);
  v_sesion_id      uuid;
  v_num_mov        int;
  v_i              int;
  v_hora_mov       timestamptz;
  v_tipo           public.tipo_movimiento;
  v_categoria      uuid;
  v_monto          numeric(12,2);
  v_neto           numeric(12,2);
  v_stand_id       uuid;
  v_fondo          numeric(12,2);
  v_venta_stand    numeric(12,2);
begin
  for v_caja_id, v_empresa_id in
    select c.id, c.empresa_id from public.cajas c
    where c.empresa_id in (
      'e1000000-0000-0000-0000-000000000001',
      'e1000000-0000-0000-0000-000000000002',
      'e1000000-0000-0000-0000-000000000003'
    )
    and c.tipo = 'empresa'
  loop
    v_monto_apertura := round((100 + random() * 200)::numeric, 2);

    for v_offset in reverse 5..0 loop
      v_dia := v_hoy_lima - v_offset;
      v_apertura := (v_dia + time '08:00' + (random() * interval '30 minutes')) at time zone 'America/Lima';

      insert into public.sesiones_caja (caja_id, apertura_at, monto_apertura, abierta_por)
      values (v_caja_id, v_apertura, v_monto_apertura, v_actor)
      returning id into v_sesion_id;

      v_neto := 0;
      v_num_mov := 3 + floor(random() * 4)::int; -- 3 a 6 movimientos

      for v_i in 1..v_num_mov loop
        if random() < 0.6 then
          v_tipo := 'ingreso';
          v_categoria := case when random() < 0.7 then v_cat_ing1 else v_cat_ing2 end;
          v_monto := round((20 + random() * 280)::numeric, 2);
          v_neto := v_neto + v_monto;
        else
          v_tipo := 'egreso';
          v_categoria := case when random() < 0.7 then v_cat_egr1 else v_cat_egr2 end;
          v_monto := round((15 + random() * 135)::numeric, 2);
          v_neto := v_neto - v_monto;
        end if;

        v_hora_mov := v_apertura + (random() * interval '11 hours');
        if v_offset = 0 and v_hora_mov > now() then
          v_hora_mov := now();
        end if;

        insert into public.movimientos
          (caja_id, sesion_id, tipo, monto, categoria_id, fecha, creado_por)
        values
          (v_caja_id, v_sesion_id, v_tipo, v_monto, v_categoria, v_hora_mov, v_actor);
      end loop;

      -- Fondo fijo de stands: entrega en la mañana, recepción de la
      -- venta completa en la noche. Montos independientes a propósito
      -- (no se espera que "entregado" y "recibido" coincidan).
      for v_stand_id in select id from public.stands where empresa_id = v_empresa_id loop
        v_fondo := round((200 + random() * 200)::numeric, 2);
        v_hora_mov := v_apertura + interval '15 minutes';
        if v_offset = 0 and v_hora_mov > now() then
          v_hora_mov := now();
        end if;

        insert into public.movimientos
          (caja_id, sesion_id, tipo, monto, stand_id, descripcion, fecha, creado_por)
        values
          (v_caja_id, v_sesion_id, 'egreso', v_fondo, v_stand_id, 'Fondo fijo del día', v_hora_mov, v_actor);
        v_neto := v_neto - v_fondo;

        v_venta_stand := round((500 + random() * 2000)::numeric, 2);
        v_hora_mov := v_apertura + interval '11 hours' + (random() * interval '30 minutes');
        if v_offset = 0 and v_hora_mov > now() then
          v_hora_mov := now();
        end if;

        insert into public.movimientos
          (caja_id, sesion_id, tipo, monto, stand_id, descripcion, fecha, creado_por)
        values
          (v_caja_id, v_sesion_id, 'ingreso', v_venta_stand, v_stand_id, 'Venta del día reportada por el stand', v_hora_mov, v_actor);
        v_neto := v_neto + v_venta_stand;
      end loop;

      v_esperado := v_monto_apertura + v_neto;

      if v_offset = 0 then
        -- Hoy queda abierta, como una caja realmente en uso.
        null;
      else
        v_contado := greatest(round((v_esperado + (random() * 10 - 5))::numeric, 2), 0);
        v_cierre := v_apertura + interval '11 hours' + (random() * interval '40 minutes');

        update public.sesiones_caja
        set cierre_at = v_cierre,
            monto_esperado = v_esperado,
            monto_contado = v_contado,
            diferencia = v_contado - v_esperado,
            cerrada_por = v_actor
        where id = v_sesion_id;

        v_monto_apertura := v_contado; -- el saldo contado pasa como apertura del día siguiente
      end if;
    end loop;
  end loop;
end $$;
