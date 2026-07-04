-- ============================================================
-- SCBox — Funciones de permisos (3 capas), RPC de stands y
-- vista de saldos pendientes por stand.
--
--   admin_general       → todo: usuarios, permisos, empresas,
--                          stands, categorías, cualquier caja.
--   admin_organizacion  → ve todas las empresas y ADMINISTRA
--                          cualquier caja (abrir/cerrar/
--                          modificar/corregir); no gestiona
--                          empresas, stands ni usuarios.
--   admin_empresa       → sin rol_global (asignaciones): solo
--                          su(s) empresa(s), incluida su caja y
--                          sus stands.
-- ============================================================

-- Renombrado: mismo OID, así las políticas que ya lo usaban
-- (perfiles/empresas/asignaciones/categorías) siguen funcionando
-- sin tocarlas.
alter function public.es_admin() rename to es_admin_general;

create or replace function public.es_admin_general()
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = (select auth.uid())
      and rol_global = 'admin_general'
      and activo
  );
$$;

-- Puede administrar (no solo operar) cualquier caja: abrir, cerrar,
-- modificar, corregir sesiones cerradas. admin_organizacion se suma
-- aquí respecto al viejo cajero_general, que solo operaba.
create or replace function public.puede_operar_todas()
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = (select auth.uid())
      and rol_global in ('admin_general', 'admin_organizacion')
      and activo
  );
$$;

-- El primer administrador nace admin_general (antes 'admin')
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre, email, rol_global)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    new.email,
    case when new.email = 'josepu03@gmail.com' then 'admin_general'::public.rol_global end
  );
  return new;
end;
$$;

-- stand_id también es inmutable una vez registrado el movimiento
-- (igual que transferencia_id): corregir = anular + registrar de nuevo.
create or replace function public.proteger_movimiento()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.anulado_at is not null then
    raise exception 'Un movimiento anulado no se puede modificar';
  end if;

  if new.caja_id          is distinct from old.caja_id
  or new.sesion_id        is distinct from old.sesion_id
  or new.tipo              is distinct from old.tipo
  or new.monto             is distinct from old.monto
  or new.categoria_id      is distinct from old.categoria_id
  or new.fecha             is distinct from old.fecha
  or new.creado_por        is distinct from old.creado_por
  or new.transferencia_id  is distinct from old.transferencia_id
  or new.stand_id          is distinct from old.stand_id then
    raise exception 'Para corregir monto, tipo o categoría: anula el movimiento y registra uno nuevo';
  end if;

  return new;
end;
$$;

-- ============================================================
-- Entrega/devolución de efectivo a un stand (fondo fijo diario):
-- se registran como movimientos de la caja de EMPRESA dueña del
-- stand (no del stand, que no tiene caja propia). Requiere sesión
-- abierta en esa caja, igual que un movimiento normal.
-- ============================================================

create function public.entregar_a_stand(
  p_stand_id uuid,
  p_monto numeric,
  p_observaciones text default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_empresa_id uuid;
  v_caja_id uuid;
  v_sesion_id uuid;
  v_movimiento_id uuid;
begin
  select empresa_id into v_empresa_id
  from public.stands
  where id = p_stand_id and activo;

  if v_empresa_id is null then
    raise exception 'Stand no encontrado o inactivo';
  end if;

  select id into v_caja_id
  from public.cajas
  where empresa_id = v_empresa_id and tipo = 'empresa';

  select id into v_sesion_id
  from public.sesiones_caja
  where caja_id = v_caja_id and cierre_at is null;

  if v_sesion_id is null then
    raise exception 'La caja de la empresa no tiene una sesión abierta';
  end if;

  insert into public.movimientos
    (caja_id, sesion_id, tipo, monto, stand_id, descripcion, creado_por)
  values
    (v_caja_id, v_sesion_id, 'egreso', p_monto, p_stand_id,
     nullif(trim(p_observaciones), ''), (select auth.uid()))
  returning id into v_movimiento_id;

  return v_movimiento_id;
end;
$$;

create function public.recibir_de_stand(
  p_stand_id uuid,
  p_monto numeric,
  p_observaciones text default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_empresa_id uuid;
  v_caja_id uuid;
  v_sesion_id uuid;
  v_movimiento_id uuid;
begin
  select empresa_id into v_empresa_id
  from public.stands
  where id = p_stand_id and activo;

  if v_empresa_id is null then
    raise exception 'Stand no encontrado o inactivo';
  end if;

  select id into v_caja_id
  from public.cajas
  where empresa_id = v_empresa_id and tipo = 'empresa';

  select id into v_sesion_id
  from public.sesiones_caja
  where caja_id = v_caja_id and cierre_at is null;

  if v_sesion_id is null then
    raise exception 'La caja de la empresa no tiene una sesión abierta';
  end if;

  insert into public.movimientos
    (caja_id, sesion_id, tipo, monto, stand_id, descripcion, creado_por)
  values
    (v_caja_id, v_sesion_id, 'ingreso', p_monto, p_stand_id,
     nullif(trim(p_observaciones), ''), (select auth.uid()))
  returning id into v_movimiento_id;

  return v_movimiento_id;
end;
$$;

-- ============================================================
-- Saldo pendiente por stand: entregado − devuelto acumulado
-- (no anulado). En un ciclo diario bien rendido debería volver a
-- cero cada noche; si no, muestra cuánto efectivo sigue afuera.
-- ============================================================

create view public.saldos_stands
with (security_invoker = true)
as
select
  s.id         as stand_id,
  s.empresa_id,
  s.nombre,
  s.activo,
  coalesce(sum(case when m.tipo = 'egreso'  then m.monto else 0 end), 0)
    - coalesce(sum(case when m.tipo = 'ingreso' then m.monto else 0 end), 0)
    as saldo_pendiente
from public.stands s
left join public.movimientos m
  on m.stand_id = s.id and m.anulado_at is null
group by s.id, s.empresa_id, s.nombre, s.activo;
