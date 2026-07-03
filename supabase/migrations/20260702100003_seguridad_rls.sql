-- ============================================================
-- SCBox — Row Level Security
-- Los permisos por rol viven en la BD, no solo en la interfaz:
--   admin           → todo
--   cajero_general  → ve y opera todas las cajas; no administra
--   encargado       → solo sus empresas asignadas
-- ============================================================

alter table public.empresas       enable row level security;
alter table public.cajas          enable row level security;
alter table public.perfiles       enable row level security;
alter table public.asignaciones   enable row level security;
alter table public.categorias     enable row level security;
alter table public.sesiones_caja  enable row level security;
alter table public.transferencias enable row level security;
alter table public.movimientos    enable row level security;

-- ============================================================
-- perfiles: todos los usuarios ven los nombres (para mostrar
-- quién registró cada cosa); solo el admin los gestiona.
-- El alta la hace el trigger handle_new_user, no la app.
-- ============================================================

create policy "ver perfiles"
  on public.perfiles for select
  to authenticated
  using (true);

create policy "admin gestiona perfiles"
  on public.perfiles for update
  to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- ============================================================
-- empresas: se ven según acceso; solo el admin las gestiona
-- ============================================================

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

-- ============================================================
-- cajas: se ven según acceso; las gestionan el admin y el
-- encargado de la empresa (el cajero general NO gestiona)
-- ============================================================

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

-- ============================================================
-- asignaciones: cada uno ve las suyas; solo el admin asigna
-- ============================================================

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

-- ============================================================
-- categorias: catálogo global visible para todos;
-- solo el admin lo gestiona
-- ============================================================

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

-- ============================================================
-- sesiones_caja: abrir/cerrar quien tiene acceso a la caja;
-- corregir sesiones cerradas solo admin y cajero general.
-- No hay política de delete: las sesiones nunca se borran.
-- ============================================================

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

-- ============================================================
-- movimientos: registrar en sesión abierta quien tiene acceso;
-- en sesiones cerradas solo admin y cajero general (corrección).
-- No hay política de delete: los movimientos nunca se borran.
-- ============================================================

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

-- ============================================================
-- transferencias: se necesita acceso a AMBAS cajas para crear
-- o anular; se ven teniendo acceso a cualquiera de las dos.
-- No hay política de delete: las transferencias nunca se borran.
-- ============================================================

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
