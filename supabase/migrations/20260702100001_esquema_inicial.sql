-- ============================================================
-- SCBox — Esquema inicial
-- Organización → Empresas → Cajas (central / stands)
-- El saldo NUNCA se almacena: se calcula desde los movimientos.
-- Nada se borra: los movimientos y transferencias se anulan con rastro.
-- ============================================================

-- Tipos
create type public.tipo_caja as enum ('stand', 'central');
create type public.tipo_movimiento as enum ('ingreso', 'egreso');
create type public.rol_global as enum ('admin', 'cajero_general');

-- ============================================================
-- Tablas
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
  descripcion      text,
  comprobante_url  text, -- foto o documento (boleta, recibo, PDF) en Supabase Storage
  fecha            timestamptz not null default now(),
  creado_por       uuid not null references public.perfiles (id),
  transferencia_id uuid references public.transferencias (id) on delete restrict,
  anulado_at       timestamptz,
  anulado_por      uuid references public.perfiles (id),
  motivo_anulacion text,
  -- todo movimiento lleva categoría, salvo los generados por una transferencia
  constraint categoria_o_transferencia check (categoria_id is not null or transferencia_id is not null),
  constraint anulacion_completa check (
    anulado_at is null
    or (anulado_por is not null and length(trim(motivo_anulacion)) > 0)
  )
);

create index movimientos_sesion_idx on public.movimientos (sesion_id);
create index movimientos_caja_fecha_idx on public.movimientos (caja_id, fecha desc);
create index movimientos_categoria_idx on public.movimientos (categoria_id);
create index movimientos_transferencia_idx on public.movimientos (transferencia_id);

-- ============================================================
-- Perfil automático al crear un usuario en auth.users.
-- El primer administrador nace con rol admin por su email.
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
    case when new.email = 'josepu03@gmail.com' then 'admin'::public.rol_global end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
