-- ============================================================
-- SCBox — RLS: cajas (nuevo alcance de administración) y stands.
-- Las políticas de perfiles/empresas/asignaciones/categorías NO
-- se tocan: siguen apuntando a la misma función (renombrada
-- es_admin → es_admin_general con el mismo OID).
-- ============================================================

-- ============================================================
-- cajas: crear queda exclusivo del admin general (las cajas de
-- empresa se crean solas por trigger; la de organización ya
-- existe). Administrar (abrir/cerrar/modificar/corregir) se
-- resuelve en sesiones_caja vía puede_operar_todas()/asignación,
-- pero editar la ficha de la caja (nombre, activa) también se
-- abre a admin_organizacion. Las cajas nunca se eliminan.
-- ============================================================

drop policy "gestionar cajas de su empresa (crear)" on public.cajas;

create policy "admin general crea cajas"
  on public.cajas for insert
  to authenticated
  with check (public.es_admin_general());

drop policy "gestionar cajas de su empresa (editar)" on public.cajas;

create policy "administrar cajas"
  on public.cajas for update
  to authenticated
  using (public.puede_operar_todas() or public.esta_asignado(empresa_id))
  with check (public.puede_operar_todas() or public.esta_asignado(empresa_id));

drop policy "gestionar cajas de su empresa (eliminar)" on public.cajas;
-- sin política de eliminar: se desactivan (activa = false), nunca se borran

-- ============================================================
-- stands: se ven según acceso a la empresa; los gestiona
-- (crear/editar) el admin general o el admin de esa empresa.
-- admin_organizacion las VE pero no las administra (fuera de su
-- alcance: "solo cajas"). No hay política de eliminar.
-- ============================================================

alter table public.stands enable row level security;

create policy "ver stands con acceso"
  on public.stands for select
  to authenticated
  using (public.puede_acceder_empresa(empresa_id));

create policy "gestionar stands de su empresa (crear)"
  on public.stands for insert
  to authenticated
  with check (public.es_admin_general() or public.esta_asignado(empresa_id));

create policy "gestionar stands de su empresa (editar)"
  on public.stands for update
  to authenticated
  using (public.es_admin_general() or public.esta_asignado(empresa_id))
  with check (public.es_admin_general() or public.esta_asignado(empresa_id));
