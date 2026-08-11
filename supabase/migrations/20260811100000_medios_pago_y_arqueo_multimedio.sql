-- ============================================================
-- Cuadre por medio de pago: catálogo de medios (tarjeta/
-- transferencia) gestionado por admin_general, movimientos con
-- medio de pago, y arqueo por medio al cerrar caja.
--
-- Decisión clave: tarjeta/transferencia NO afectan el saldo de
-- efectivo. saldos_cajas y el "esperado" de cerrar_caja siguen
-- calculándose solo sobre movimientos en efectivo; los demás
-- medios se cuadran aparte en la tabla arqueos_sesion. El
-- histórico existente queda como efectivo (default de la nueva
-- columna), coherente con lo que ya contaban los saldos actuales.
-- ============================================================

-- ── 1. Catálogo de medios de pago ───────────────────────────
-- Global (no por empresa), igual criterio que categorias. El
-- efectivo no vive acá: es implícito y no se puede desactivar
-- ni renombrar por accidente.

create type public.tipo_medio_pago as enum ('efectivo', 'tarjeta', 'transferencia');

create table public.medios_pago (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  tipo        public.tipo_medio_pago not null,
  descripcion text,
  icono       text,
  color       text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  constraint medio_no_efectivo check (tipo <> 'efectivo'),
  unique (nombre, tipo)
);

alter table public.medios_pago enable row level security;

create policy "ver medios de pago"
  on public.medios_pago for select
  to authenticated
  using (true);

create policy "admin general crea medios de pago"
  on public.medios_pago for insert
  to authenticated
  with check (public.es_admin_general());

create policy "admin general edita medios de pago"
  on public.medios_pago for update
  to authenticated
  using (public.es_admin_general())
  with check (public.es_admin_general());

create policy "admin general elimina medios de pago"
  on public.medios_pago for delete
  to authenticated
  using (public.es_admin_general());

-- ── 2. Movimientos: medio de pago ───────────────────────────
-- default 'efectivo' es el backfill del histórico: todo lo que
-- ya existía se contaba como efectivo, así que queda coherente
-- sin tocar una sola fila.

alter table public.movimientos
  add column medio         public.tipo_medio_pago not null default 'efectivo',
  add column medio_pago_id uuid references public.medios_pago (id),
  add column referencia    text;

alter table public.movimientos
  add constraint medio_coherente check (
    (medio = 'efectivo' and medio_pago_id is null) or
    (medio <> 'efectivo' and medio_pago_id is not null)
  );

create index movimientos_medio_idx on public.movimientos (sesion_id, medio, medio_pago_id);

-- validar_movimiento: además de lo que ya validaba, exige que el
-- tipo del medio_pago_id coincida con medio, que el medio esté
-- activo, y que transferencias/fondo fijo de stand sean siempre
-- en efectivo (el dinero entre cajas y el fondo fijo es físico).
create or replace function public.validar_movimiento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caja_sesion uuid;
  v_tipo_categoria public.tipo_movimiento;
  v_tipo_medio public.tipo_medio_pago;
  v_medio_activo boolean;
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

  if (new.transferencia_id is not null or new.stand_id is not null) and new.medio <> 'efectivo' then
    raise exception 'Las transferencias entre cajas y el fondo fijo de stands siempre son en efectivo';
  end if;

  if new.medio_pago_id is not null then
    select tipo, activo into v_tipo_medio, v_medio_activo
    from public.medios_pago where id = new.medio_pago_id;

    if v_tipo_medio is null then
      raise exception 'Medio de pago no encontrado';
    end if;

    if v_tipo_medio is distinct from new.medio then
      raise exception 'El tipo del medio de pago no coincide con el medio indicado';
    end if;

    if not v_medio_activo then
      raise exception 'El medio de pago está desactivado';
    end if;
  end if;

  return new;
end;
$$;

-- proteger_movimiento: medio/medio_pago_id se suman a las columnas
-- inmutables (corregir = anular + registrar de nuevo).
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
  or new.stand_id          is distinct from old.stand_id
  or new.medio             is distinct from old.medio
  or new.medio_pago_id     is distinct from old.medio_pago_id then
    raise exception 'Para corregir monto, tipo o categoría: anula el movimiento y registra uno nuevo';
  end if;

  return new;
end;
$$;

-- ── 3. Arqueo por medio (no-efectivo) ───────────────────────
-- El efectivo se queda en sesiones_caja.monto_esperado/contado/
-- diferencia (esas columnas pasan a significar "efectivo").

create table public.arqueos_sesion (
  id             uuid primary key default gen_random_uuid(),
  sesion_id      uuid not null references public.sesiones_caja (id) on delete restrict,
  medio_pago_id  uuid not null references public.medios_pago (id),
  monto_esperado numeric(12,2) not null,
  monto_contado  numeric(12,2) not null,
  diferencia     numeric(12,2) not null,
  observaciones  text,
  unique (sesion_id, medio_pago_id)
);

create index arqueos_sesion_idx on public.arqueos_sesion (sesion_id);

alter table public.arqueos_sesion enable row level security;

create policy "ver arqueos con acceso"
  on public.arqueos_sesion for select
  to authenticated
  using (
    exists (
      select 1 from public.sesiones_caja s
      where s.id = sesion_id and public.puede_acceder_caja(s.caja_id)
    )
  );

create policy "insertar arqueos con acceso"
  on public.arqueos_sesion for insert
  to authenticated
  with check (
    exists (
      select 1 from public.sesiones_caja s
      where s.id = sesion_id and public.puede_acceder_caja(s.caja_id)
    )
  );

create policy "corregir arqueos"
  on public.arqueos_sesion for update
  to authenticated
  using (public.puede_operar_todas())
  with check (public.puede_operar_todas());

-- Vista de apoyo: esperado por medio (no-efectivo) de cada sesión,
-- para prellenar el cierre y el detalle de sesión.
create view public.esperados_por_medio
with (security_invoker = true)
as
select
  m.sesion_id,
  m.medio_pago_id,
  sum(case when m.tipo = 'ingreso' then m.monto else -m.monto end) as monto_esperado
from public.movimientos m
where m.anulado_at is null and m.medio <> 'efectivo'
group by m.sesion_id, m.medio_pago_id;

-- ── 4. saldos_cajas: el saldo de caja es solo efectivo ──────
-- Este es el cambio que evita que un cobro con tarjeta infle el
-- saldo/arqueo de efectivo.
create or replace view public.saldos_cajas
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
  where m.sesion_id = sa.id and m.anulado_at is null and m.medio = 'efectivo'
) mov on true
left join lateral (
  select s2.monto_contado
  from public.sesiones_caja s2
  where s2.caja_id = c.id and s2.cierre_at is not null
  order by s2.cierre_at desc
  limit 1
) ult on true;

-- ── 5. registrar_movimiento: medio de pago opcional ─────────
-- create or replace no basta al agregar un parámetro (crea un
-- overload y PostgREST no puede elegir cuál usar): hay que borrar
-- la firma anterior primero.
drop function if exists public.registrar_movimiento(uuid, public.tipo_movimiento, numeric, uuid, text, text, timestamptz);

create or replace function public.registrar_movimiento(
  p_caja_id uuid,
  p_tipo public.tipo_movimiento,
  p_monto numeric,
  p_categoria_id uuid,
  p_descripcion text default null,
  p_comprobante_url text default null,
  p_fecha timestamptz default null,
  p_medio_pago_id uuid default null,
  p_referencia text default null
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
  v_medio public.tipo_medio_pago := case when p_medio_pago_id is null then 'efectivo' else null end;
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

  if p_medio_pago_id is not null then
    select tipo into v_medio from public.medios_pago where id = p_medio_pago_id;

    if v_medio is null then
      raise exception 'Medio de pago no encontrado';
    end if;
  end if;

  insert into public.movimientos
    (caja_id, sesion_id, tipo, monto, categoria_id, descripcion, comprobante_url, fecha, creado_por,
     medio, medio_pago_id, referencia)
  values
    (p_caja_id, v_sesion_id, p_tipo, p_monto, p_categoria_id,
     nullif(trim(p_descripcion), ''), p_comprobante_url, v_fecha, (select auth.uid()),
     v_medio, p_medio_pago_id, nullif(trim(p_referencia), ''))
  returning id into v_movimiento_id;

  return v_movimiento_id;
end;
$$;

-- ── 6. cerrar_caja: arqueo por medio ─────────────────────────
-- El "esperado" del cierre pasa a ser solo efectivo. p_arqueos es
-- un jsonb con forma [{"medio_pago_id":"…","monto_contado":123.45,
-- "observaciones":null}, ...]. Si algún medio con movimiento en
-- la sesión no viene en p_arqueos, el cierre falla: nunca un
-- cierre a medias, mismo espíritu que el constraint cierre_completo.
drop function if exists public.cerrar_caja(uuid, numeric, text, timestamptz);

create or replace function public.cerrar_caja(
  p_sesion_id uuid,
  p_monto_contado numeric,
  p_observaciones text default null,
  p_fecha timestamptz default null,
  p_arqueos jsonb default '[]'
)
returns public.sesiones_caja
language plpgsql
set search_path = ''
as $$
declare
  v_sesion public.sesiones_caja;
  v_esperado numeric(12,2);
  v_cierre_at timestamptz := coalesce(p_fecha, now());
  v_arqueo jsonb;
  v_medio_pago_id uuid;
  v_monto_contado_medio numeric(12,2);
  v_esperado_medio numeric(12,2);
  v_medios_pendientes text;
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

  -- Todo medio con movimiento no anulado en la sesión debe venir en
  -- p_arqueos, o el cierre queda a medias.
  select string_agg(mp.nombre, ', ')
  into v_medios_pendientes
  from (
    select distinct m.medio_pago_id
    from public.movimientos m
    where m.sesion_id = p_sesion_id and m.anulado_at is null and m.medio <> 'efectivo'
  ) pendientes
  join public.medios_pago mp on mp.id = pendientes.medio_pago_id
  where not exists (
    select 1 from jsonb_array_elements(p_arqueos) a
    where (a ->> 'medio_pago_id')::uuid = pendientes.medio_pago_id
  );

  if v_medios_pendientes is not null then
    raise exception 'Falta cuadrar el medio de pago: %', v_medios_pendientes;
  end if;

  select v_sesion.monto_apertura + coalesce(
    sum(case when m.tipo = 'ingreso' then m.monto else -m.monto end), 0)
  into v_esperado
  from public.movimientos m
  where m.sesion_id = p_sesion_id and m.anulado_at is null and m.medio = 'efectivo';

  update public.sesiones_caja
  set cierre_at            = v_cierre_at,
      cerrada_por          = (select auth.uid()),
      monto_esperado       = v_esperado,
      monto_contado        = p_monto_contado,
      diferencia           = p_monto_contado - v_esperado,
      observaciones_cierre = nullif(trim(p_observaciones), '')
  where id = p_sesion_id
  returning * into v_sesion;

  for v_arqueo in select * from jsonb_array_elements(p_arqueos)
  loop
    v_medio_pago_id := (v_arqueo ->> 'medio_pago_id')::uuid;
    v_monto_contado_medio := (v_arqueo ->> 'monto_contado')::numeric;

    if v_monto_contado_medio < 0 then
      raise exception 'El monto contado de un medio de pago no puede ser negativo';
    end if;

    select coalesce(sum(case when m.tipo = 'ingreso' then m.monto else -m.monto end), 0)
    into v_esperado_medio
    from public.movimientos m
    where m.sesion_id = p_sesion_id and m.anulado_at is null and m.medio_pago_id = v_medio_pago_id;

    insert into public.arqueos_sesion (sesion_id, medio_pago_id, monto_esperado, monto_contado, diferencia, observaciones)
    values (
      p_sesion_id, v_medio_pago_id, v_esperado_medio, v_monto_contado_medio,
      v_monto_contado_medio - v_esperado_medio,
      nullif(trim(v_arqueo ->> 'observaciones'), '')
    )
    on conflict (sesion_id, medio_pago_id) do update
    set monto_esperado = excluded.monto_esperado,
        monto_contado  = excluded.monto_contado,
        diferencia     = excluded.diferencia,
        observaciones  = excluded.observaciones;
  end loop;

  return v_sesion;
end;
$$;

-- ── 7. recalcular_arqueo: cubrir también arqueos_sesion ─────
-- Si se anula/inserta un movimiento de una sesión YA CERRADA, el
-- efectivo se recalcula igual que antes, y además, si el
-- movimiento es de un medio no-efectivo, se recalcula (o crea) su
-- fila en arqueos_sesion. Si el medio no se había cuadrado al
-- cerrar, se crea con monto_contado = 0 (mejor visible que oculto).
create or replace function public.recalcular_arqueo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_esperado_medio numeric(12,2);
begin
  update public.sesiones_caja s
  set monto_esperado = s.monto_apertura + coalesce((
        select sum(case when m.tipo = 'ingreso' then m.monto else -m.monto end)
        from public.movimientos m
        where m.sesion_id = s.id and m.anulado_at is null and m.medio = 'efectivo'
      ), 0),
      diferencia = s.monto_contado - (s.monto_apertura + coalesce((
        select sum(case when m.tipo = 'ingreso' then m.monto else -m.monto end)
        from public.movimientos m
        where m.sesion_id = s.id and m.anulado_at is null and m.medio = 'efectivo'
      ), 0))
  where s.id = new.sesion_id
    and s.cierre_at is not null;

  if new.medio_pago_id is not null then
    select coalesce(sum(case when m.tipo = 'ingreso' then m.monto else -m.monto end), 0)
    into v_esperado_medio
    from public.movimientos m
    where m.sesion_id = new.sesion_id and m.anulado_at is null and m.medio_pago_id = new.medio_pago_id;

    insert into public.arqueos_sesion (sesion_id, medio_pago_id, monto_esperado, monto_contado, diferencia)
    select new.sesion_id, new.medio_pago_id, v_esperado_medio, 0, 0 - v_esperado_medio
    where exists (select 1 from public.sesiones_caja s where s.id = new.sesion_id and s.cierre_at is not null)
    on conflict (sesion_id, medio_pago_id) do update
    set monto_esperado = v_esperado_medio,
        diferencia     = public.arqueos_sesion.monto_contado - v_esperado_medio;
  end if;

  return new;
end;
$$;
