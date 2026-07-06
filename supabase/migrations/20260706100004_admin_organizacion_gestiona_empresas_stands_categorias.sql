-- ============================================================
-- SCBox — admin_organizacion amplía su alcance: además de ver
-- todas las empresas y administrar cualquier caja, ahora también
-- gestiona (crear/editar) empresas, stands y categorías — antes
-- exclusivo de admin_general (ver comentario en
-- 20260705100003_funciones_roles_y_stands.sql, ya desactualizado
-- en ese punto). admin_general sigue siendo el único que puede
-- gestionar usuarios/permisos y eliminar (hard delete) filas.
-- ============================================================

drop policy "admin crea empresas" on public.empresas;

create policy "gestionar empresas (crear)"
  on public.empresas for insert
  to authenticated
  with check (public.puede_operar_todas());

drop policy "admin edita empresas" on public.empresas;

create policy "gestionar empresas (editar)"
  on public.empresas for update
  to authenticated
  using (public.puede_operar_todas())
  with check (public.puede_operar_todas());

drop policy "admin crea categorias" on public.categorias;

create policy "gestionar categorias (crear)"
  on public.categorias for insert
  to authenticated
  with check (public.puede_operar_todas());

drop policy "admin edita categorias" on public.categorias;

create policy "gestionar categorias (editar)"
  on public.categorias for update
  to authenticated
  using (public.puede_operar_todas())
  with check (public.puede_operar_todas());

drop policy "gestionar stands de su empresa (crear)" on public.stands;

create policy "gestionar stands (crear)"
  on public.stands for insert
  to authenticated
  with check (public.puede_operar_todas() or public.esta_asignado(empresa_id));

drop policy "gestionar stands de su empresa (editar)" on public.stands;

create policy "gestionar stands (editar)"
  on public.stands for update
  to authenticated
  using (public.puede_operar_todas() or public.esta_asignado(empresa_id))
  with check (public.puede_operar_todas() or public.esta_asignado(empresa_id));
