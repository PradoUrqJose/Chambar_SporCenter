-- ============================================================
-- SCBox — Reestructuración: Caja de Organización + Caja de Empresa
-- Los stands dejan de ser cajas con sesión propia: pasan a ser
-- destinos registrados bajo una empresa que solo reciben/devuelven
-- efectivo (fondo fijo diario), sin abrir/cerrar caja.
--
-- No destructivo: no se borra ninguna caja/sesión/movimiento
-- histórico. Las cajas tipo 'stand' que ya existieran quedan como
-- historial congelado (el valor de enum se conserva sin uso futuro).
-- ============================================================

-- ============================================================
-- 1. cajas: admite una caja sin empresa (la de organización)
-- ============================================================

alter table public.cajas alter column empresa_id drop not null;

alter table public.cajas add constraint organizacion_sin_empresa check (
  (tipo = 'organizacion' and empresa_id is null)
  or (tipo <> 'organizacion' and empresa_id is not null)
);

-- Como mucho una caja de organización en todo el sistema
create unique index una_caja_organizacion
  on public.cajas (tipo)
  where tipo = 'organizacion';

-- ============================================================
-- 2. stands: registrados bajo una empresa, sin sesión propia
-- ============================================================

create table public.stands (
  id         uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete restrict,
  nombre     text not null,
  activo     boolean not null default true,
  created_at timestamptz not null default now()
);

create index stands_empresa_idx on public.stands (empresa_id);

-- ============================================================
-- 3. movimientos: rastro de a qué stand corresponde una
--    entrega/devolución de efectivo (se registra en la caja
--    de la empresa dueña del stand, no en una caja propia)
-- ============================================================

alter table public.movimientos add column stand_id uuid references public.stands (id) on delete restrict;

create index movimientos_stand_idx on public.movimientos (stand_id);

alter table public.movimientos drop constraint categoria_o_transferencia;

alter table public.movimientos add constraint categoria_transferencia_o_stand check (
  categoria_id is not null or transferencia_id is not null or stand_id is not null
);

-- ============================================================
-- 4. Cada empresa tiene siempre exactamente una caja tipo 'empresa'
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
-- 5. Datos: caja de organización única + backfill de cajas de
--    empresa para empresas que aún no tuvieran una (idempotente)
-- ============================================================

insert into public.cajas (empresa_id, nombre, tipo)
select null, 'Caja de organización', 'organizacion'
where not exists (select 1 from public.cajas where tipo = 'organizacion');

insert into public.cajas (empresa_id, nombre, tipo)
select e.id, 'Caja ' || e.nombre, 'empresa'
from public.empresas e
where not exists (
  select 1 from public.cajas c where c.empresa_id = e.id and c.tipo = 'empresa'
);
