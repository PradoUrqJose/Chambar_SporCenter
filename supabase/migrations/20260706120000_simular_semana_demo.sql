-- ============================================================
-- SCBox — Reset de historial transaccional + simulación de una
-- semana de actividad en 3 empresas nuevas, para probar el panel
-- y la PWA con datos que se comporten como datos reales.
--
-- ADVERTENCIA: la sección 1 borra TODOS los movimientos,
-- transferencias y sesiones de caja existentes, de cualquier
-- empresa (no solo las nuevas). No se puede deshacer una vez
-- aplicada con `supabase db push`. Las empresas, cajas, stands,
-- usuarios y categorías actuales NO se tocan.
-- ============================================================

-- 1) Vaciar historial transaccional de todas las cajas existentes
delete from public.movimientos;
delete from public.transferencias;
delete from public.sesiones_caja;

-- 2) 3 empresas nuevas (cada una recibe su caja automáticamente
--    vía el trigger empresas_crear_caja)
insert into public.empresas (id, nombre, ruc, color) values
  ('e1000000-0000-0000-0000-000000000001', 'Nutrisabor SAC',             '20123456781', '#7c3aed'),
  ('e1000000-0000-0000-0000-000000000002', 'Ferretería El Tornillo SRL', '20123456782', '#16a34a'),
  ('e1000000-0000-0000-0000-000000000003', 'Boutique Marea EIRL',        '20123456783', '#f97316')
on conflict (id) do nothing;

-- 3) Simular 6 días de actividad (hoy + los 5 anteriores, hora
--    Lima) por cada caja nueva: apertura, 3-6 movimientos variados
--    y cierre con pequeña variación de arqueo. El día de hoy queda
--    abierto, como una caja realmente en uso.
do $$
declare
  v_actor          uuid := '96db3ecf-3523-4201-ba29-3db87ce6ad00'; -- Alberto Prado (admin_organizacion)
  v_hoy_lima       date := (now() at time zone 'America/Lima')::date;
  v_cat_ing1       uuid := (select id from public.categorias where nombre = 'Venta diaria (prueba)' and tipo = 'ingreso');
  v_cat_ing2       uuid := (select id from public.categorias where nombre = 'Otros ingresos (prueba)' and tipo = 'ingreso');
  v_cat_egr1       uuid := (select id from public.categorias where nombre = 'Compra de Mercadería (prueba)' and tipo = 'egreso');
  v_cat_egr2       uuid := (select id from public.categorias where nombre = 'Pago de servicios (prueba)' and tipo = 'egreso');
  v_caja_id        uuid;
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
begin
  for v_caja_id in
    select c.id from public.cajas c
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
