-- ============================================================
-- SCBox — Eliminar Caja de Organización
-- Nunca tuvo pantalla de operación (ni web ni PWA) ni un caso de uso
-- de negocio real (confirmado con el usuario, 2026-07-06): vuelve el
-- modelo a solo cajas de empresa. El valor 'organizacion' del enum
-- tipo_caja queda deprecado sin uso, mismo criterio ya usado con
-- 'stand' en la migración de reestructura.
-- ============================================================

do $$
begin
  if exists (
    select 1
    from public.sesiones_caja s
    join public.cajas c on c.id = s.caja_id
    where c.tipo = 'organizacion'
  ) then
    raise exception 'La caja de organización tiene sesiones registradas, no se puede eliminar a ciegas';
  end if;
end $$;

delete from public.cajas where tipo = 'organizacion';

alter table public.cajas drop constraint organizacion_sin_empresa;
drop index public.una_caja_organizacion;

alter table public.cajas alter column empresa_id set not null;
