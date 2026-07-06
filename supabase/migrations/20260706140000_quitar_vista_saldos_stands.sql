-- ============================================================
-- SCBox — Quita la vista saldos_stands: su semántica (entregado -
-- devuelto por stand debería volver a 0) no aplica al negocio real
-- (confirmado con el usuario, 2026-07-06). El monto que se entrega
-- de fondo fijo no tiene por qué coincidir con lo que el stand
-- devuelve (que es TODO su efectivo de ventas, no solo el fondo).
-- entregar_a_stand/recibir_de_stand siguen igual: son movimientos
-- normales de la caja de empresa, cuentan para el saldo y los
-- reportes como cualquier otro.
-- ============================================================

drop view public.saldos_stands;
