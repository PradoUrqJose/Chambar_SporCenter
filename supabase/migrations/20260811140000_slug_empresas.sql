-- ============================================================
-- Slug para empresas: hoy /panel/cajas/{empresaId} usa el UUID
-- crudo en la URL. Se agrega un slug legible (derivado del nombre,
-- ej. "Empresa Demo Dos" -> "empresa-demo-dos") para usarlo como
-- identificador de ruta en su lugar. El UUID sigue siendo la PK
-- real en todos lados; el slug es solo una puerta de entrada.
-- ============================================================

create or replace function public.generar_slug(texto text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      lower(
        translate(
          texto,
          'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
          'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'
        )
      ),
      '[^a-z0-9]+', '-', 'g'
    )
  );
$$;

alter table public.empresas add column slug text;

-- Backfill: si dos empresas generan el mismo slug base, a la segunda
-- (y siguientes) se les agrega un sufijo numérico para que quede único.
with numerados as (
  select
    id,
    coalesce(nullif(public.generar_slug(nombre), ''), 'empresa') as base,
    row_number() over (partition by coalesce(nullif(public.generar_slug(nombre), ''), 'empresa') order by created_at, id) as rn
  from public.empresas
)
update public.empresas e
set slug = case when n.rn = 1 then n.base else n.base || '-' || n.rn::text end
from numerados n
where n.id = e.id;

-- Default '' (no null) para que el insert no tenga que mandar slug a mano
-- —igual que "id" con su gen_random_uuid()— y el generador de tipos de
-- Supabase lo marque como opcional en el Insert. El trigger de abajo
-- trata '' igual que null: siempre lo reemplaza por el slug real.
alter table public.empresas
  alter column slug set default '',
  alter column slug set not null,
  add constraint empresas_slug_key unique (slug);

-- Empresas nuevas: el slug se genera solo a partir del nombre (con
-- sufijo numérico si ya existe uno igual). Si en algún flujo futuro se
-- quiere fijar el slug a mano, basta con mandarlo ya seteado (no vacío)
-- y este trigger no lo pisa.
create or replace function public.empresas_generar_slug()
returns trigger
language plpgsql
as $$
declare
  base text;
  candidato text;
  sufijo int := 1;
begin
  if new.slug is not null and new.slug <> '' then
    return new;
  end if;

  base := coalesce(nullif(public.generar_slug(new.nombre), ''), 'empresa');
  candidato := base;

  while exists (select 1 from public.empresas where slug = candidato and id <> new.id) loop
    sufijo := sufijo + 1;
    candidato := base || '-' || sufijo;
  end loop;

  new.slug := candidato;
  return new;
end;
$$;

create trigger empresas_slug_bi
  before insert on public.empresas
  for each row execute function public.empresas_generar_slug();
