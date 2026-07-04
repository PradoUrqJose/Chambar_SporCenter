-- ============================================================
-- SCBox — Enums de la reestructuración organización/empresa/stands.
-- Aislado en su propia migración: Postgres no permite usar un
-- valor de enum recién agregado (ADD VALUE) dentro de la misma
-- transacción en la que se agregó (ej. en un CHECK constraint).
-- ============================================================

alter type public.tipo_caja add value 'organizacion';
alter type public.tipo_caja rename value 'central' to 'empresa';

alter type public.rol_global rename value 'admin' to 'admin_general';
alter type public.rol_global rename value 'cajero_general' to 'admin_organizacion';
