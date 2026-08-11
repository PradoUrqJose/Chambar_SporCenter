-- Las políticas RLS de este proyecto siempre asumieron los GRANT base que
-- trae un proyecto Supabase por defecto (SELECT/INSERT/UPDATE/DELETE para
-- authenticated en cada tabla nueva). Ese grant nunca quedó capturado en
-- una migración —posiblemente se aplicó una sola vez desde el SQL Editor
-- del dashboard remoto— así que el proyecto remoto funciona pero cualquier
-- base local nueva (`supabase start` / `supabase db reset`) nace sin él:
-- RLS permite la fila pero Postgres deniega la tabla entera con
-- "permission denied for table X" (42501), rompiendo toda lectura/escritura
-- para cualquier usuario autenticado.
--
-- RLS sigue siendo la única barrera real por fila; esto solo habilita el
-- primer nivel de permisos que Postgres exige antes de evaluar las políticas.
grant select, insert, update, delete
  on all tables in schema public
  to authenticated;

-- Para que las tablas que se creen de acá en adelante (via migración)
-- también nazcan con este grant sin tener que repetirlo a mano.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
