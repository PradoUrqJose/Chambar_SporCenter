-- ============================================================
-- Chambar — Export consolidado del esquema de Supabase
-- Generado a partir de supabase/migrations/*.sql (fuente de verdad).
-- Este archivo es solo de referencia/contexto: no ejecutar directamente,
-- las migraciones reales viven en supabase/migrations/.
-- ============================================================

-- ── 20260702100001_esquema_inicial.sql ──────────────────────
-- Tipos, tablas base, índices, trigger de alta de usuario.

create type public.tipo_caja as enum ('stand', 'central');
create type public.tipo_movimiento as enum ('ingreso', 'egreso');
create type public.rol_global as enum ('admin', 'cajero_general');

create table public.empresas (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  ruc        text,
  color      text,
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

create table public.perfiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nombre     text not null,
  email      text not null unique,
  rol_global public.rol_global,
  activo     boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.asignaciones (
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (usuario_id, empresa_id)
);

create index asignaciones_empresa_idx on public.asignaciones (empresa_id);

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
  constraint cierre_completo check (
    cierre_at is null
    or (monto_esperado is not null and monto_contado is not null and cerrada_por is not null)
  )
);

create unique index una_sesion_abierta_por_caja
  on public.sesiones_caja (caja_id)
  where cierre_at is null;

create index sesiones_caja_historial_idx on public.sesiones_caja (caja_id, apertura_at desc);

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
  comprobante_url  text,
  fecha            timestamptz not null default now(),
  creado_por       uuid not null references public.perfiles (id),
  transferencia_id uuid references public.transferencias (id) on delete restrict,
  anulado_at       timestamptz,
  anulado_por      uuid references public.perfiles (id),
  motivo_anulacion text,
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

-- ── 20260702100002_funciones_negocio.sql ────────────────────
-- Funciones de permisos (RLS), triggers de integridad, RPC de
-- negocio (abrir/cerrar caja, movimientos, transferencias) y
-- la vista de saldos calculados.

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

create function public.puede_acceder_empresa(p_empresa_id uuid)
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select public.puede_operar_todas() or public.esta_asignado(p_empresa_id);
$$;

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

  if exists (
    select 1 from public.movimientos
    where transferencia_id = p_transferencia_id
      and anulado_at is null
  ) then
    raise exception 'No tienes permiso para anular movimientos de una sesión ya cerrada';
  end if;
end;
$$;

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

-- ── 20260702100003_seguridad_rls.sql ────────────────────────
-- RLS: admin (todo) / cajero_general (opera todas las cajas,
-- no administra) / encargado (solo empresas asignadas).

alter table public.empresas       enable row level security;
alter table public.cajas          enable row level security;
alter table public.perfiles       enable row level security;
alter table public.asignaciones   enable row level security;
alter table public.categorias     enable row level security;
alter table public.sesiones_caja  enable row level security;
alter table public.transferencias enable row level security;
alter table public.movimientos    enable row level security;

create policy "ver perfiles"
  on public.perfiles for select
  to authenticated
  using (true);

create policy "admin gestiona perfiles"
  on public.perfiles for update
  to authenticated
  using (public.es_admin())
  with check (public.es_admin());

create policy "ver empresas con acceso"
  on public.empresas for select
  to authenticated
  using (public.puede_acceder_empresa(id));

create policy "admin crea empresas"
  on public.empresas for insert
  to authenticated
  with check (public.es_admin());

create policy "admin edita empresas"
  on public.empresas for update
  to authenticated
  using (public.es_admin())
  with check (public.es_admin());

create policy "admin elimina empresas"
  on public.empresas for delete
  to authenticated
  using (public.es_admin());

create policy "ver cajas con acceso"
  on public.cajas for select
  to authenticated
  using (public.puede_acceder_empresa(empresa_id));

create policy "gestionar cajas de su empresa (crear)"
  on public.cajas for insert
  to authenticated
  with check (public.es_admin() or public.esta_asignado(empresa_id));

create policy "gestionar cajas de su empresa (editar)"
  on public.cajas for update
  to authenticated
  using (public.es_admin() or public.esta_asignado(empresa_id))
  with check (public.es_admin() or public.esta_asignado(empresa_id));

create policy "gestionar cajas de su empresa (eliminar)"
  on public.cajas for delete
  to authenticated
  using (public.es_admin() or public.esta_asignado(empresa_id));

create policy "ver asignaciones propias o admin"
  on public.asignaciones for select
  to authenticated
  using (usuario_id = (select auth.uid()) or public.es_admin());

create policy "admin crea asignaciones"
  on public.asignaciones for insert
  to authenticated
  with check (public.es_admin());

create policy "admin elimina asignaciones"
  on public.asignaciones for delete
  to authenticated
  using (public.es_admin());

create policy "ver categorias"
  on public.categorias for select
  to authenticated
  using (true);

create policy "admin crea categorias"
  on public.categorias for insert
  to authenticated
  with check (public.es_admin());

create policy "admin edita categorias"
  on public.categorias for update
  to authenticated
  using (public.es_admin())
  with check (public.es_admin());

create policy "admin elimina categorias"
  on public.categorias for delete
  to authenticated
  using (public.es_admin());

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

-- ── 20260704100001_storage_comprobantes.sql ─────────────────
-- Bucket privado para comprobantes; ruta {caja_id}/{archivo};
-- el acceso se resuelve igual que a la caja.

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
