-- ============================================================
-- SCBox — Un encargado de empresa (rol_global null) maneja una
-- sola empresa a la vez (confirmado con el usuario, 2026-07-06).
-- Antes solo se validaba "al menos una" en la app; ahora se
-- garantiza como "exactamente una" también a nivel de BD.
-- asignar_rol_usuario ya borra las asignaciones previas antes de
-- insertar las nuevas, así que esto nunca debería violarse en uso
-- normal — es defensa en profundidad, no un cambio de comportamiento.
-- ============================================================

alter table public.asignaciones
  add constraint una_empresa_por_usuario unique (usuario_id);
