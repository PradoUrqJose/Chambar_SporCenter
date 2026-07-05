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
