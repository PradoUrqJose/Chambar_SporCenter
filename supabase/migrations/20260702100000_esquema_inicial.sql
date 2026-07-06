-- ============================================================
-- SCBox — Esquema inicial (consolidado)
-- Organización → Empresas → Cajas (una por empresa) → Stands
-- (destinos de fondo fijo, sin caja propia).
--
-- El saldo NUNCA se almacena: se calcula desde los movimientos.
-- Nada se borra: los movimientos y transferencias se anulan con
-- rastro; las cajas/stands se desactivan, nunca se eliminan.
--
--   admin_general       → todo: usuarios, permisos, empresas,
--                          stands, categorías, cualquier caja.
--   admin_organizacion  → ve todas las empresas y administra
--                          cualquier caja (abrir/cerrar/
--                          modificar/corregir), gestiona
--                          empresas, stands y categorías; no
--                          gestiona usuarios/permisos.
--   admin_empresa        → sin rol_global (permisos vía
--                          asignaciones): solo su(s) empresa(s),
--                          incluida su caja y sus stands.
-- ============================================================

-- ============================================================
-- 1. Tipos
-- ============================================================

create type public.tipo_caja as enum ('empresa');
create type public.tipo_movimiento as enum ('ingreso', 'egreso');
create type public.rol_global as enum ('admin_general', 'admin_organizacion');

-- ============================================================
-- 2. Tablas
-- ============================================================

create table public.empresas (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  ruc        text,
  color      text, -- color identificador en la app (ej. '#0ea5e9')
  activa     boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.cajas (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete restrict,
  nombre     text not null,
  tipo       public.tipo_caja not null,
  activa     boolean not null default true,
  created_at timestamptz not null default now()
);

create index cajas_empresa_idx on public.cajas (empresa_id);

-- Perfil espejo de auth.users (se crea por trigger al crear el usuario)
create table public.perfiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nombre     text not null,
  email      text not null unique,
  rol_global public.rol_global, -- null = encargado de empresa (permisos vía asignaciones)
  activo     boolean not null default true,
  created_at timestamptz not null default now()
);

-- Empresas que maneja cada encargado
create table public.asignaciones (
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (usuario_id, empresa_id)
);

create index asignaciones_empresa_idx on public.asignaciones (empresa_id);

-- Catálogo global: cada fila es una operación (ej. "Compra de Mercadería" / egreso)
create table public.categorias (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  tipo        public.tipo_movimiento not null,
  descripcion text,
  icono       text,
  color       text,
  activa      boolean not null default true,
  unique (nombre, tipo)
);

-- Stands: registrados bajo una empresa, sin sesión propia. Solo
-- reciben/devuelven efectivo (fondo fijo diario) contra la caja
-- de la empresa dueña.
create table public.stands (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete restrict,
  nombre     text not null,
  activo     boolean not null default true,
  created_at timestamptz not null default now()
);

create index stands_empresa_idx on public.stands (empresa_id);

-- Sesión = apertura → movimientos → cierre con arqueo
create table public.sesiones_caja (
  id                     uuid primary key default gen_random_uuid(),
  caja_id                uuid not null references public.cajas (id) on delete restrict,
  apertura_at            timestamptz not null default now(),
  monto_apertura         numeric(12,2) not null check (monto_apertura >= 0),
  observaciones_apertura text,
  cierre_at              timestamptz,
  monto_esperado         numeric(12,2),
  monto_contado          numeric(12,2),
  diferencia             numeric(12,2),
  observaciones_cierre   text,
  abierta_por            uuid not null references public.perfiles (id),
  cerrada_por            uuid references public.perfiles (id),
  -- una sesión cerrada debe tener el arqueo completo
  constraint cierre_completo check (
    cierre_at is null
    or (monto_esperado is not null and monto_contado is not null and cerrada_por is not null)
  )
);

-- Regla clave: solo puede haber UNA sesión abierta por caja
create unique index una_sesion_abierta_por_caja
  on public.sesiones_caja (caja_id)
  where cierre_at is null;

create index sesiones_caja_historial_idx on public.sesiones_caja (caja_id, apertura_at desc);

-- Transferencia entre cajas: un registro genera 2 movimientos vinculados
create table public.transferencias (
  id               uuid primary key default gen_random_uuid(),
  caja_origen_id   uuid not null references public.cajas (id),
  caja_destino_id  uuid not null references public.cajas (id),
  monto            numeric(12,2) not null check (monto > 0),
  descripcion      text,
  creado_por       uuid not null references public.perfiles (id),
  created_at       timestamptz not null default now(),
  anulado_at       timestamptz,
  anulado_por      uuid references public.perfiles (id),
  motivo_anulacion text,
  constraint cajas_distintas check (caja_origen_id <> caja_destino_id),
  constraint anulacion_completa check (
    anulado_at is null
    or (anulado_por is not null and length(trim(motivo_anulacion)) > 0)
  )
);

create table public.movimientos (
  id               uuid primary key default gen_random_uuid(),
  caja_id          uuid not null references public.cajas (id) on delete restrict,
  sesion_id        uuid not null references public.sesiones_caja (id) on delete restrict,
  tipo             public.tipo_movimiento not null,
  monto            numeric(12,2) not null check (monto > 0),
  categoria_id     uuid references public.categorias (id),
  stand_id         uuid references public.stands (id) on delete restrict,
  descripcion      text,
  comprobante_url  text, -- foto o documento (boleta, recibo, PDF) en Supabase Storage
  fecha            timestamptz not null default now(),
  creado_por       uuid not null references public.perfiles (id),
  transferencia_id uuid references public.transferencias (id) on delete restrict,
  anulado_at       timestamptz,
  anulado_por      uuid references public.perfiles (id),
  motivo_anulacion text,
  -- todo movimiento lleva categoría, salvo los generados por una
  -- transferencia o una entrega/devolución de fondo fijo a un stand
  constraint categoria_transferencia_o_stand check (
    categoria_id is not null or transferencia_id is not null or stand_id is not null
  ),
  constraint anulacion_completa check (
    anulado_at is null
    or (anulado_por is not null and length(trim(motivo_anulacion)) > 0)
  )
);

create index movimientos_sesion_idx on public.movimientos (sesion_id);
create index movimientos_caja_fecha_idx on public.movimientos (caja_id, fecha desc);
create index movimientos_categoria_idx on public.movimientos (categoria_id);
create index movimientos_transferencia_idx on public.movimientos (transferencia_id);
create index movimientos_stand_idx on public.movimientos (stand_id);

-- ============================================================
-- 3. Funciones de permisos (usadas por las políticas RLS)
--    security definer para poder leer perfiles/asignaciones
--    sin recursión de políticas.
-- ============================================================

-- ¿El usuario actual es admin general (y está activo)?
create function public.es_admin_general()
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

-- ¿Puede administrar (no solo operar) cualquier caja? (admin_general
-- o admin_organizacion): abrir, cerrar, modificar, corregir sesiones
-- cerradas, y gestionar empresas/stands/categorías.
create function public.puede_operar_todas()
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
-- 4. Perfil automático al crear un usuario en auth.users.
--    El primer administrador nace admin_general por su email.
-- ============================================================

create function public.handle_new_user()
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 5. Cada empresa tiene siempre exactamente una caja
-- ============================================================

create function public.crear_caja_empresa()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.cajas (empresa_id, nombre, tipo)
  values (new.id, 'Caja ' || new.nombre, 'empresa');
  return new;
end;
$$;

create trigger empresas_crear_caja
  after insert on public.empresas
  for each row execute function public.crear_caja_empresa();

-- ============================================================
-- 6. Triggers de integridad sobre movimientos y transferencias
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
-- 7. Operaciones de caja (RPC que usará la aplicación)
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
-- Entrega/devolución de efectivo a un stand (fondo fijo diario):
-- se registran como movimientos de la caja de la empresa dueña del
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
-- 8. RPCs de perfil y gestión de usuarios
-- ============================================================

-- La policy de UPDATE en perfiles solo permite al admin general. Para
-- que cualquier usuario pueda editar su propio nombre desde Ajustes,
-- sin abrir la puerta a que se autoasigne otro rol_global o se
-- reactive si lo desactivaron, se usa un RPC security definer acotado
-- a esa única columna, en vez de una policy de UPDATE amplia sobre la
-- fila completa.
create function public.actualizar_mi_nombre(p_nombre text)
returns public.perfiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perfil public.perfiles;
begin
  if length(trim(coalesce(p_nombre, ''))) = 0 then
    raise exception 'El nombre no puede estar vacío';
  end if;

  update public.perfiles
  set nombre = trim(p_nombre)
  where id = (select auth.uid())
  returning * into v_perfil;

  if not found then
    raise exception 'Perfil no encontrado';
  end if;

  return v_perfil;
end;
$$;

-- El alta de la identidad (auth.users) se hace por invitación desde el
-- cliente de Admin API (service role, fuera de RLS) — eso crea la fila en
-- perfiles vía el trigger handle_new_user, pero sin rol_global ni empresas
-- asignadas. Este RPC completa esa segunda mitad: security invoker (no
-- definer), las policies ya existentes ("admin gestiona perfiles",
-- "admin crea/elimina asignaciones", ambas sobre es_admin_general()) son
-- las que de verdad restringen esto a admin_general.
create function public.asignar_rol_usuario(
  p_usuario_id uuid,
  p_rol_global public.rol_global,
  p_empresa_ids uuid[] default '{}'
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.perfiles
  set rol_global = p_rol_global
  where id = p_usuario_id;

  if not found then
    raise exception 'Usuario no encontrado o sin acceso';
  end if;

  delete from public.asignaciones where usuario_id = p_usuario_id;

  if p_rol_global is null and coalesce(array_length(p_empresa_ids, 1), 0) > 0 then
    insert into public.asignaciones (usuario_id, empresa_id)
    select p_usuario_id, empresa_id from unnest(p_empresa_ids) as empresa_id;
  end if;
end;
$$;

-- ============================================================
-- 9. Vista de saldos (nunca almacenados)
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

-- ============================================================
-- 10. Storage: bucket de comprobantes de movimientos
--     Privado. Ruta de cada archivo: {caja_id}/{archivo}
--     El acceso se resuelve igual que a la caja.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

create policy "ver comprobantes de cajas con acceso"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'comprobantes'
    and public.puede_acceder_caja((storage.foldername(name))[1]::uuid)
  );

create policy "subir comprobantes de cajas con acceso"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'comprobantes'
    and public.puede_acceder_caja((storage.foldername(name))[1]::uuid)
  );

-- ============================================================
-- 11. Row Level Security
--     Los permisos por rol viven en la BD, no solo en la interfaz.
-- ============================================================

alter table public.empresas       enable row level security;
alter table public.cajas          enable row level security;
alter table public.perfiles       enable row level security;
alter table public.asignaciones   enable row level security;
alter table public.categorias     enable row level security;
alter table public.stands         enable row level security;
alter table public.sesiones_caja  enable row level security;
alter table public.transferencias enable row level security;
alter table public.movimientos    enable row level security;

-- ------------------------------------------------------------
-- perfiles: todos los usuarios ven los nombres (para mostrar
-- quién registró cada cosa); solo el admin general los gestiona.
-- El alta la hace el trigger handle_new_user, no la app.
-- ------------------------------------------------------------

create policy "ver perfiles"
  on public.perfiles for select
  to authenticated
  using (true);

create policy "admin gestiona perfiles"
  on public.perfiles for update
  to authenticated
  using (public.es_admin_general())
  with check (public.es_admin_general());

-- ------------------------------------------------------------
-- empresas: se ven según acceso; las gestionan (crear/editar)
-- admin_general y admin_organizacion; solo admin_general elimina.
-- ------------------------------------------------------------

create policy "ver empresas con acceso"
  on public.empresas for select
  to authenticated
  using (public.puede_acceder_empresa(id));

create policy "gestionar empresas (crear)"
  on public.empresas for insert
  to authenticated
  with check (public.puede_operar_todas());

create policy "gestionar empresas (editar)"
  on public.empresas for update
  to authenticated
  using (public.puede_operar_todas())
  with check (public.puede_operar_todas());

create policy "admin elimina empresas"
  on public.empresas for delete
  to authenticated
  using (public.es_admin_general());

-- ------------------------------------------------------------
-- cajas: se ven según acceso; crear queda exclusivo del admin
-- general (las cajas de empresa se crean solas por trigger).
-- Administrar (nombre, activa) lo hace admin_general,
-- admin_organizacion o el encargado de esa empresa. Las cajas
-- nunca se eliminan (se desactivan).
-- ------------------------------------------------------------

create policy "ver cajas con acceso"
  on public.cajas for select
  to authenticated
  using (public.puede_acceder_empresa(empresa_id));

create policy "admin general crea cajas"
  on public.cajas for insert
  to authenticated
  with check (public.es_admin_general());

create policy "administrar cajas"
  on public.cajas for update
  to authenticated
  using (public.puede_operar_todas() or public.esta_asignado(empresa_id))
  with check (public.puede_operar_todas() or public.esta_asignado(empresa_id));

-- ------------------------------------------------------------
-- asignaciones: cada uno ve las suyas; solo el admin general asigna
-- ------------------------------------------------------------

create policy "ver asignaciones propias o admin"
  on public.asignaciones for select
  to authenticated
  using (usuario_id = (select auth.uid()) or public.es_admin_general());

create policy "admin crea asignaciones"
  on public.asignaciones for insert
  to authenticated
  with check (public.es_admin_general());

create policy "admin elimina asignaciones"
  on public.asignaciones for delete
  to authenticated
  using (public.es_admin_general());

-- ------------------------------------------------------------
-- categorias: catálogo global visible para todos; las gestionan
-- (crear/editar) admin_general y admin_organizacion; solo
-- admin_general elimina.
-- ------------------------------------------------------------

create policy "ver categorias"
  on public.categorias for select
  to authenticated
  using (true);

create policy "gestionar categorias (crear)"
  on public.categorias for insert
  to authenticated
  with check (public.puede_operar_todas());

create policy "gestionar categorias (editar)"
  on public.categorias for update
  to authenticated
  using (public.puede_operar_todas())
  with check (public.puede_operar_todas());

create policy "admin elimina categorias"
  on public.categorias for delete
  to authenticated
  using (public.es_admin_general());

-- ------------------------------------------------------------
-- stands: se ven según acceso a la empresa; los gestiona
-- (crear/editar) admin_general, admin_organizacion o el
-- encargado de esa empresa. No hay política de eliminar.
-- ------------------------------------------------------------

create policy "ver stands con acceso"
  on public.stands for select
  to authenticated
  using (public.puede_acceder_empresa(empresa_id));

create policy "gestionar stands (crear)"
  on public.stands for insert
  to authenticated
  with check (public.puede_operar_todas() or public.esta_asignado(empresa_id));

create policy "gestionar stands (editar)"
  on public.stands for update
  to authenticated
  using (public.puede_operar_todas() or public.esta_asignado(empresa_id))
  with check (public.puede_operar_todas() or public.esta_asignado(empresa_id));

-- ------------------------------------------------------------
-- sesiones_caja: abrir/cerrar quien tiene acceso a la caja;
-- corregir sesiones cerradas solo admin_general/admin_organizacion.
-- No hay política de delete: las sesiones nunca se borran.
-- ------------------------------------------------------------

create policy "ver sesiones con acceso"
  on public.sesiones_caja for select
  to authenticated
  using (public.puede_acceder_caja(caja_id));

create policy "abrir caja con acceso"
  on public.sesiones_caja for insert
  to authenticated
  with check (
    public.puede_acceder_caja(caja_id)
    and abierta_por = (select auth.uid())
    and cierre_at is null
  );

create policy "operar sesion abierta"
  on public.sesiones_caja for update
  to authenticated
  using (cierre_at is null and public.puede_acceder_caja(caja_id))
  with check (public.puede_acceder_caja(caja_id));

create policy "corregir sesion cerrada"
  on public.sesiones_caja for update
  to authenticated
  using (cierre_at is not null and public.puede_operar_todas())
  with check (public.puede_operar_todas());

-- ------------------------------------------------------------
-- movimientos: registrar en sesión abierta quien tiene acceso;
-- en sesiones cerradas solo admin_general/admin_organizacion
-- (corrección). No hay política de delete: nunca se borran.
-- ------------------------------------------------------------

create policy "ver movimientos con acceso"
  on public.movimientos for select
  to authenticated
  using (public.puede_acceder_caja(caja_id));

create policy "registrar movimientos"
  on public.movimientos for insert
  to authenticated
  with check (
    public.puede_acceder_caja(caja_id)
    and creado_por = (select auth.uid())
    and (
      exists (
        select 1 from public.sesiones_caja s
        where s.id = sesion_id and s.cierre_at is null
      )
      or public.puede_operar_todas()
    )
  );

create policy "anular en sesion abierta"
  on public.movimientos for update
  to authenticated
  using (
    public.puede_acceder_caja(caja_id)
    and exists (
      select 1 from public.sesiones_caja s
      where s.id = sesion_id and s.cierre_at is null
    )
  )
  with check (public.puede_acceder_caja(caja_id));

create policy "corregir en sesion cerrada"
  on public.movimientos for update
  to authenticated
  using (public.puede_operar_todas())
  with check (public.puede_operar_todas());

-- ------------------------------------------------------------
-- transferencias: se necesita acceso a AMBAS cajas para crear
-- o anular; se ven teniendo acceso a cualquiera de las dos.
-- No hay política de delete: las transferencias nunca se borran.
-- ------------------------------------------------------------

create policy "ver transferencias con acceso"
  on public.transferencias for select
  to authenticated
  using (
    public.puede_acceder_caja(caja_origen_id)
    or public.puede_acceder_caja(caja_destino_id)
  );

create policy "crear transferencias"
  on public.transferencias for insert
  to authenticated
  with check (
    public.puede_acceder_caja(caja_origen_id)
    and public.puede_acceder_caja(caja_destino_id)
    and creado_por = (select auth.uid())
  );

create policy "anular transferencias"
  on public.transferencias for update
  to authenticated
  using (
    public.puede_acceder_caja(caja_origen_id)
    and public.puede_acceder_caja(caja_destino_id)
  )
  with check (
    public.puede_acceder_caja(caja_origen_id)
    and public.puede_acceder_caja(caja_destino_id)
  );
