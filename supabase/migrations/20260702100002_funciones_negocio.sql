-- ============================================================
-- SCBox — Funciones de negocio, triggers y vista de saldos
-- ============================================================

-- ============================================================
-- 1. Funciones de permisos (usadas por las políticas RLS)
--    security definer para poder leer perfiles/asignaciones
--    sin recursión de políticas.
-- ============================================================

-- ¿El usuario actual es admin general (y está activo)?
create function public.es_admin()
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = (select auth.uid())
      and rol_global = 'admin'
      and activo
  );
$$;

-- ¿Puede operar todas las cajas? (admin o encargado general de cajas)
create function public.puede_operar_todas()
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = (select auth.uid())
      and rol_global in ('admin', 'cajero_general')
      and activo
  );
$$;

-- ¿El usuario actual (activo) tiene asignada esta empresa?
create function public.esta_asignado(p_empresa_id uuid)
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.asignaciones a
    join public.perfiles p on p.id = a.usuario_id and p.activo
    where a.usuario_id = (select auth.uid())
      and a.empresa_id = p_empresa_id
  );
$$;

-- ¿Puede ver/operar esta empresa? (roles globales o asignación)
create function public.puede_acceder_empresa(p_empresa_id uuid)
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select public.puede_operar_todas() or public.esta_asignado(p_empresa_id);
$$;

-- ¿Puede ver/operar esta caja? (vía la empresa dueña)
create function public.puede_acceder_caja(p_caja_id uuid)
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select public.puede_operar_todas() or exists (
    select 1
    from public.cajas c
    where c.id = p_caja_id
      and public.esta_asignado(c.empresa_id)
  );
$$;

-- ============================================================
-- 2. Triggers de integridad sobre movimientos
-- ============================================================

-- Validaciones al insertar un movimiento:
--  - la sesión debe pertenecer a la misma caja
--  - el tipo del movimiento debe coincidir con el tipo de la categoría
create function public.validar_movimiento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caja_sesion uuid;
  v_tipo_categoria public.tipo_movimiento;
begin
  select caja_id into v_caja_sesion
  from public.sesiones_caja where id = new.sesion_id;

  if v_caja_sesion is distinct from new.caja_id then
    raise exception 'La sesión no pertenece a la caja indicada';
  end if;

  if new.categoria_id is not null then
    select tipo into v_tipo_categoria
    from public.categorias where id = new.categoria_id;

    if v_tipo_categoria is distinct from new.tipo then
      raise exception 'El tipo del movimiento no coincide con el tipo de la categoría';
    end if;
  end if;

  return new;
end;
$$;

create trigger movimientos_validar
  before insert on public.movimientos
  for each row execute function public.validar_movimiento();

-- Nada se edita "por debajo": solo se permite anular (con motivo) y
-- corregir descripción o comprobante. Editar montos = anular + crear nuevo.
-- Un movimiento ya anulado es inmutable.
create function public.proteger_movimiento()
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
  or new.tipo             is distinct from old.tipo
  or new.monto            is distinct from old.monto
  or new.categoria_id     is distinct from old.categoria_id
  or new.fecha            is distinct from old.fecha
  or new.creado_por       is distinct from old.creado_por
  or new.transferencia_id is distinct from old.transferencia_id then
    raise exception 'Para corregir monto, tipo o categoría: anula el movimiento y registra uno nuevo';
  end if;

  return new;
end;
$$;

create trigger movimientos_proteger
  before update on public.movimientos
  for each row execute function public.proteger_movimiento();

-- Si se corrige (anula) un movimiento de una sesión YA CERRADA,
-- el arqueo se recalcula automáticamente: esperado y diferencia.
create function public.recalcular_arqueo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.sesiones_caja s
  set monto_esperado = s.monto_apertura + coalesce((
        select sum(case when m.tipo = 'ingreso' then m.monto else -m.monto end)
        from public.movimientos m
        where m.sesion_id = s.id and m.anulado_at is null
      ), 0),
      diferencia = s.monto_contado - (s.monto_apertura + coalesce((
        select sum(case when m.tipo = 'ingreso' then m.monto else -m.monto end)
        from public.movimientos m
        where m.sesion_id = s.id and m.anulado_at is null
      ), 0))
  where s.id = new.sesion_id
    and s.cierre_at is not null;

  return new;
end;
$$;

create trigger movimientos_recalcular_arqueo
  after insert or update on public.movimientos
  for each row execute function public.recalcular_arqueo();

-- Las transferencias tampoco se editan: solo se anulan (o se corrige la descripción)
create function public.proteger_transferencia()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.anulado_at is not null then
    raise exception 'Una transferencia anulada no se puede modificar';
  end if;

  if new.caja_origen_id  is distinct from old.caja_origen_id
  or new.caja_destino_id is distinct from old.caja_destino_id
  or new.monto           is distinct from old.monto
  or new.creado_por      is distinct from old.creado_por
  or new.created_at      is distinct from old.created_at then
    raise exception 'Para corregir una transferencia: anúlala y crea una nueva';
  end if;

  return new;
end;
$$;

create trigger transferencias_proteger
  before update on public.transferencias
  for each row execute function public.proteger_transferencia();

-- ============================================================
-- 3. Operaciones de caja (RPC que usará la aplicación)
--    security invoker: las políticas RLS del usuario aplican.
-- ============================================================

-- Abrir caja con el monto inicial contado
create function public.abrir_caja(
  p_caja_id uuid,
  p_monto_apertura numeric,
  p_observaciones text default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_sesion_id uuid;
begin
  if p_monto_apertura < 0 then
    raise exception 'El monto de apertura no puede ser negativo';
  end if;

  insert into public.sesiones_caja (caja_id, monto_apertura, observaciones_apertura, abierta_por)
  values (p_caja_id, p_monto_apertura, nullif(trim(p_observaciones), ''), (select auth.uid()))
  returning id into v_sesion_id;

  return v_sesion_id;
exception
  when unique_violation then
    raise exception 'La caja ya tiene una sesión abierta';
end;
$$;

-- Cerrar caja con arqueo: calcula esperado y diferencia
create function public.cerrar_caja(
  p_sesion_id uuid,
  p_monto_contado numeric,
  p_observaciones text default null
)
returns public.sesiones_caja
language plpgsql
set search_path = ''
as $$
declare
  v_sesion public.sesiones_caja;
  v_esperado numeric(12,2);
begin
  if p_monto_contado < 0 then
    raise exception 'El monto contado no puede ser negativo';
  end if;

  select * into v_sesion
  from public.sesiones_caja
  where id = p_sesion_id
  for update;

  if not found then
    raise exception 'Sesión no encontrada o sin acceso';
  end if;

  if v_sesion.cierre_at is not null then
    raise exception 'La sesión ya está cerrada';
  end if;

  select v_sesion.monto_apertura + coalesce(
    sum(case when m.tipo = 'ingreso' then m.monto else -m.monto end), 0)
  into v_esperado
  from public.movimientos m
  where m.sesion_id = p_sesion_id and m.anulado_at is null;

  update public.sesiones_caja
  set cierre_at            = now(),
      cerrada_por          = (select auth.uid()),
      monto_esperado       = v_esperado,
      monto_contado        = p_monto_contado,
      diferencia           = p_monto_contado - v_esperado,
      observaciones_cierre = nullif(trim(p_observaciones), '')
  where id = p_sesion_id
  returning * into v_sesion;

  return v_sesion;
end;
$$;

-- Registrar un ingreso o egreso en la sesión abierta de la caja
create function public.registrar_movimiento(
  p_caja_id uuid,
  p_tipo public.tipo_movimiento,
  p_monto numeric,
  p_categoria_id uuid,
  p_descripcion text default null,
  p_comprobante_url text default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_sesion_id uuid;
  v_movimiento_id uuid;
begin
  select id into v_sesion_id
  from public.sesiones_caja
  where caja_id = p_caja_id and cierre_at is null;

  if v_sesion_id is null then
    raise exception 'La caja no tiene una sesión abierta';
  end if;

  insert into public.movimientos
    (caja_id, sesion_id, tipo, monto, categoria_id, descripcion, comprobante_url, creado_por)
  values
    (p_caja_id, v_sesion_id, p_tipo, p_monto, p_categoria_id,
     nullif(trim(p_descripcion), ''), p_comprobante_url, (select auth.uid()))
  returning id into v_movimiento_id;

  return v_movimiento_id;
end;
$$;

-- Transferencia atómica entre cajas: egreso en origen + ingreso en destino.
-- Ambas cajas deben tener sesión abierta. Todo o nada.
create function public.crear_transferencia(
  p_caja_origen_id uuid,
  p_caja_destino_id uuid,
  p_monto numeric,
  p_descripcion text default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_sesion_origen uuid;
  v_sesion_destino uuid;
  v_transferencia_id uuid;
begin
  if p_caja_origen_id = p_caja_destino_id then
    raise exception 'La caja de origen y destino deben ser distintas';
  end if;

  select id into v_sesion_origen
  from public.sesiones_caja
  where caja_id = p_caja_origen_id and cierre_at is null;

  if v_sesion_origen is null then
    raise exception 'La caja de origen no tiene una sesión abierta';
  end if;

  select id into v_sesion_destino
  from public.sesiones_caja
  where caja_id = p_caja_destino_id and cierre_at is null;

  if v_sesion_destino is null then
    raise exception 'La caja de destino no tiene una sesión abierta';
  end if;

  insert into public.transferencias (caja_origen_id, caja_destino_id, monto, descripcion, creado_por)
  values (p_caja_origen_id, p_caja_destino_id, p_monto,
          nullif(trim(p_descripcion), ''), (select auth.uid()))
  returning id into v_transferencia_id;

  insert into public.movimientos
    (caja_id, sesion_id, tipo, monto, descripcion, creado_por, transferencia_id)
  values
    (p_caja_origen_id, v_sesion_origen, 'egreso', p_monto,
     nullif(trim(p_descripcion), ''), (select auth.uid()), v_transferencia_id),
    (p_caja_destino_id, v_sesion_destino, 'ingreso', p_monto,
     nullif(trim(p_descripcion), ''), (select auth.uid()), v_transferencia_id);

  return v_transferencia_id;
end;
$$;

-- Anular un movimiento (motivo obligatorio). Si su sesión ya está
-- cerrada, el trigger recalcula el arqueo automáticamente.
create function public.anular_movimiento(
  p_movimiento_id uuid,
  p_motivo text
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_movimiento public.movimientos;
begin
  if length(trim(coalesce(p_motivo, ''))) = 0 then
    raise exception 'El motivo de anulación es obligatorio';
  end if;

  select * into v_movimiento
  from public.movimientos
  where id = p_movimiento_id
  for update;

  if not found then
    raise exception 'Movimiento no encontrado o sin acceso';
  end if;

  if v_movimiento.anulado_at is not null then
    raise exception 'El movimiento ya está anulado';
  end if;

  if v_movimiento.transferencia_id is not null then
    raise exception 'Este movimiento pertenece a una transferencia: anula la transferencia completa';
  end if;

  update public.movimientos
  set anulado_at = now(),
      anulado_por = (select auth.uid()),
      motivo_anulacion = trim(p_motivo)
  where id = p_movimiento_id;
end;
$$;

-- Anular una transferencia completa: anula sus 2 movimientos vinculados
create function public.anular_transferencia(
  p_transferencia_id uuid,
  p_motivo text
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_transferencia public.transferencias;
begin
  if length(trim(coalesce(p_motivo, ''))) = 0 then
    raise exception 'El motivo de anulación es obligatorio';
  end if;

  select * into v_transferencia
  from public.transferencias
  where id = p_transferencia_id
  for update;

  if not found then
    raise exception 'Transferencia no encontrada o sin acceso';
  end if;

  if v_transferencia.anulado_at is not null then
    raise exception 'La transferencia ya está anulada';
  end if;

  update public.transferencias
  set anulado_at = now(),
      anulado_por = (select auth.uid()),
      motivo_anulacion = trim(p_motivo)
  where id = p_transferencia_id;

  update public.movimientos
  set anulado_at = now(),
      anulado_por = (select auth.uid()),
      motivo_anulacion = trim(p_motivo)
  where transferencia_id = p_transferencia_id
    and anulado_at is null;

  -- Si RLS impidió anular alguno de los 2 movimientos (ej. su sesión ya
  -- cerró y el usuario no puede corregir cerradas), se revierte todo.
  if exists (
    select 1 from public.movimientos
    where transferencia_id = p_transferencia_id
      and anulado_at is null
  ) then
    raise exception 'No tienes permiso para anular movimientos de una sesión ya cerrada';
  end if;
end;
$$;

-- ============================================================
-- 4. Vista de saldos (nunca almacenados)
--    Caja abierta:  apertura + ingresos − egresos (no anulados)
--    Caja cerrada:  monto contado del último arqueo
-- ============================================================

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
