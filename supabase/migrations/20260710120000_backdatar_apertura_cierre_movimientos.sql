-- ============================================================
-- Permite a admin_general/admin_organizacion cargar historial
-- pasado: abrir/cerrar caja y registrar movimientos con una
-- fecha anterior a hoy (ej. cargar acumulado desde el 1 de julio).
-- Operadores normales (admin_empresa) siguen usando siempre la
-- fecha/hora actual: p_fecha queda en null para ellos.
-- ============================================================

-- create or replace no reemplaza estas funciones: al agregar un parámetro
-- nuevo, Postgres las trata como un overload distinto y deja la versión
-- vieja de 3/6 argumentos activa también, lo que hace que PostgREST no
-- pueda elegir cuál usar ("could not choose the best candidate function").
-- Por eso hay que borrar la firma anterior antes de recrear.
drop function if exists public.abrir_caja(uuid, numeric, text);
drop function if exists public.cerrar_caja(uuid, numeric, text);
drop function if exists public.registrar_movimiento(uuid, public.tipo_movimiento, numeric, uuid, text, text);

create or replace function public.abrir_caja(
  p_caja_id uuid,
  p_monto_apertura numeric,
  p_observaciones text default null,
  p_fecha timestamptz default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_sesion_id uuid;
  v_apertura_at timestamptz := coalesce(p_fecha, now());
begin
  if p_monto_apertura < 0 then
    raise exception 'El monto de apertura no puede ser negativo';
  end if;

  if p_fecha is not null then
    if not public.puede_operar_todas() then
      raise exception 'Solo un administrador puede elegir la fecha de apertura';
    end if;
    if p_fecha > now() then
      raise exception 'La fecha de apertura no puede ser futura';
    end if;
  end if;

  insert into public.sesiones_caja (caja_id, apertura_at, monto_apertura, observaciones_apertura, abierta_por)
  values (p_caja_id, v_apertura_at, p_monto_apertura, nullif(trim(p_observaciones), ''), (select auth.uid()))
  returning id into v_sesion_id;

  return v_sesion_id;
exception
  when unique_violation then
    raise exception 'La caja ya tiene una sesión abierta';
end;
$$;

create or replace function public.cerrar_caja(
  p_sesion_id uuid,
  p_monto_contado numeric,
  p_observaciones text default null,
  p_fecha timestamptz default null
)
returns public.sesiones_caja
language plpgsql
set search_path = ''
as $$
declare
  v_sesion public.sesiones_caja;
  v_esperado numeric(12,2);
  v_cierre_at timestamptz := coalesce(p_fecha, now());
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

  if p_fecha is not null then
    if not public.puede_operar_todas() then
      raise exception 'Solo un administrador puede elegir la fecha de cierre';
    end if;
    if p_fecha > now() then
      raise exception 'La fecha de cierre no puede ser futura';
    end if;
    if p_fecha < v_sesion.apertura_at then
      raise exception 'La fecha de cierre no puede ser anterior a la apertura';
    end if;
  end if;

  select v_sesion.monto_apertura + coalesce(
    sum(case when m.tipo = 'ingreso' then m.monto else -m.monto end), 0)
  into v_esperado
  from public.movimientos m
  where m.sesion_id = p_sesion_id and m.anulado_at is null;

  update public.sesiones_caja
  set cierre_at            = v_cierre_at,
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

create or replace function public.registrar_movimiento(
  p_caja_id uuid,
  p_tipo public.tipo_movimiento,
  p_monto numeric,
  p_categoria_id uuid,
  p_descripcion text default null,
  p_comprobante_url text default null,
  p_fecha timestamptz default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_sesion_id uuid;
  v_apertura_at timestamptz;
  v_movimiento_id uuid;
  v_fecha timestamptz := coalesce(p_fecha, now());
begin
  select id, apertura_at into v_sesion_id, v_apertura_at
  from public.sesiones_caja
  where caja_id = p_caja_id and cierre_at is null;

  if v_sesion_id is null then
    raise exception 'La caja no tiene una sesión abierta';
  end if;

  if p_fecha is not null then
    if not public.puede_operar_todas() then
      raise exception 'Solo un administrador puede elegir la fecha del movimiento';
    end if;
    if p_fecha > now() then
      raise exception 'La fecha del movimiento no puede ser futura';
    end if;
    if p_fecha < v_apertura_at then
      raise exception 'La fecha del movimiento no puede ser anterior a la apertura de la sesión';
    end if;
  end if;

  insert into public.movimientos
    (caja_id, sesion_id, tipo, monto, categoria_id, descripcion, comprobante_url, fecha, creado_por)
  values
    (p_caja_id, v_sesion_id, p_tipo, p_monto, p_categoria_id,
     nullif(trim(p_descripcion), ''), p_comprobante_url, v_fecha, (select auth.uid()))
  returning id into v_movimiento_id;

  return v_movimiento_id;
end;
$$;
