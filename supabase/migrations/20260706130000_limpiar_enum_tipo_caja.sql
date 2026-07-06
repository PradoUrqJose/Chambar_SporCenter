-- ============================================================
-- SCBox — Limpiar tipo_caja: elimina los valores muertos 'stand'
-- y 'organizacion' (deprecados sin uso desde la reestructuración
-- de stands y la eliminación de la caja de organización). Hoy
-- toda caja viva es tipo 'empresa'; 'stand' se reemplazó por la
-- tabla stands + movimientos.stand_id, sin caja propia.
--
-- Quedaban cajas tipo 'stand' de antes de la reestructuración
-- (20260705100002_reestructura_organizacion_empresa_stands.sql),
-- sin sesiones ni movimientos (nunca se usaron): se eliminan aquí
-- con el mismo chequeo de seguridad que ya usó
-- eliminar_caja_organizacion.sql para 'organizacion'.
--
-- Postgres no permite dropear valores de un enum in-place, así que
-- se recrea el tipo con el único valor vigente y se castea la
-- columna.
-- ============================================================

do $$
begin
  if exists (
    select 1
    from public.sesiones_caja s
    join public.cajas c on c.id = s.caja_id
    where c.tipo in ('stand', 'organizacion')
  ) then
    raise exception 'Hay cajas stand/organizacion con sesiones registradas: no se puede eliminar a ciegas';
  end if;
end $$;

delete from public.cajas where tipo in ('stand', 'organizacion');

-- saldos_cajas depende de cajas.tipo: hay que dropearla y recrearla
-- igual (misma definición que en 20260702100002_funciones_negocio.sql)
-- para poder cambiar el tipo de la columna.
drop view public.saldos_cajas;

alter type public.tipo_caja rename to tipo_caja_old;
create type public.tipo_caja as enum ('empresa');

alter table public.cajas
  alter column tipo type public.tipo_caja using tipo::text::public.tipo_caja;

drop type public.tipo_caja_old;

create view public.saldos_cajas
with (security_invoker = true)
as
select
  c.id          as caja_id,
  c.empresa_id,
  c.nombre,
  c.tipo,
  c.activa,
  (sa.id is not null)       as abierta,
  sa.id                     as sesion_abierta_id,
  sa.apertura_at,
  case
    when sa.id is not null then
      sa.monto_apertura + coalesce(mov.neto, 0)
    else
      coalesce(ult.monto_contado, 0)
  end as saldo
from public.cajas c
left join public.sesiones_caja sa
  on sa.caja_id = c.id and sa.cierre_at is null
left join lateral (
  select sum(case when m.tipo = 'ingreso' then m.monto else -m.monto end) as neto
  from public.movimientos m
  where m.sesion_id = sa.id and m.anulado_at is null
) mov on true
left join lateral (
  select s2.monto_contado
  from public.sesiones_caja s2
  where s2.caja_id = c.id and s2.cierre_at is not null
  order by s2.cierre_at desc
  limit 1
) ult on true;
