-- La policy de UPDATE en perfiles solo permite al admin general (ver
-- 20260702100003_seguridad_rls.sql). Para que cualquier usuario pueda
-- editar su propio nombre desde Ajustes, sin abrir la puerta a que se
-- autoasigne otro rol_global o se reactive si lo desactivaron, se usa
-- un RPC security definer acotado a esa única columna, en vez de una
-- policy de UPDATE amplia sobre la fila completa.

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
