# Reglas de negocio — SCBox

Fuente de verdad: `supabase/migrations/`. Este documento explica el *por qué* de cada regla para no tener que releer PL/pgSQL cada vez.

## Jerarquía y acceso

- **Organización → Empresas → Cajas.** Una empresa tiene N cajas; una caja es de tipo `stand` o `central`.
- Tres niveles de acceso (ver [ENUMS.md](ENUMS.md#rol_global)):
  1. `admin` — todo.
  2. `cajero_general` — opera todas las cajas de todas las empresas (vía `puede_operar_todas()`), pero no administra empresas/categorías/perfiles/asignaciones.
  3. Encargado (`rol_global is null`) — solo las empresas donde tiene una fila en `asignaciones` (vía `esta_asignado()` / `puede_acceder_empresa()` / `puede_acceder_caja()`).
- Todas las funciones de permiso (`es_admin`, `puede_operar_todas`, `esta_asignado`, `puede_acceder_empresa`, `puede_acceder_caja`) son `security definer` para evitar recursión de políticas RLS al consultar `perfiles`/`asignaciones` desde dentro de una policy.

## El saldo nunca se almacena

- No existe una columna `saldo` persistida en `cajas`. Se calcula siempre desde `movimientos`.
- La vista `saldos_cajas` (`security_invoker = true`, respeta RLS del usuario) da el saldo por caja:
  - **Caja con sesión abierta:** `monto_apertura + Σ(ingresos) − Σ(egresos)` de los movimientos no anulados de esa sesión.
  - **Caja cerrada (sin sesión abierta):** el `monto_contado` de la última sesión cerrada (el arqueo es la verdad, no un recálculo).

## Sesiones de caja (apertura → movimientos → cierre)

- Una caja solo puede tener **una sesión abierta a la vez** (`una_sesion_abierta_por_caja`, índice único parcial sobre `cierre_at is null`). `abrir_caja()` capta la violación de unicidad y la convierte en un error de negocio legible.
- Abrir caja (`abrir_caja`) exige `monto_apertura >= 0`.
- Cerrar caja (`cerrar_caja`, arqueo):
  1. Calcula `monto_esperado = apertura + Σ(ingresos no anulados) − Σ(egresos no anulados)`.
  2. Recibe `monto_contado` (lo que el usuario contó físicamente).
  3. `diferencia = monto_contado − monto_esperado`. Positiva = sobrante, negativa = faltante.
  4. Constraint `cierre_completo`: si `cierre_at` no es null, `monto_esperado`, `monto_contado` y `cerrada_por` deben estar todos presentes — no hay cierres a medias.
- Registrar un movimiento (`registrar_movimiento`) busca la sesión abierta de la caja; si no hay ninguna, falla. No se puede operar una caja cerrada por esta vía (la corrección de una sesión cerrada es un camino aparte, ver más abajo).

## Movimientos: inmutabilidad y corrección

- **Nada se edita "por debajo".** Un movimiento solo admite: anularse (con motivo obligatorio) o corregir campos no sensibles (descripción, comprobante). Cambiar monto/tipo/categoría = anular + crear uno nuevo.
- El trigger `proteger_movimiento()` bloquea a nivel de BD cualquier `update` que toque `caja_id`, `sesion_id`, `tipo`, `monto`, `categoria_id`, `fecha`, `creado_por` o `transferencia_id`, y bloquea cualquier `update` sobre un movimiento ya anulado.
- El trigger `validar_movimiento()` exige que:
  - la `sesion_id` del movimiento pertenezca efectivamente a la `caja_id` indicada;
  - si hay `categoria_id`, su `tipo` coincida con el `tipo` del movimiento (no se puede registrar un "egreso" contra una categoría de ingreso).
- Constraint `categoria_o_transferencia`: todo movimiento normal lleva categoría; los generados por una transferencia no llevan categoría (van identificados por `transferencia_id`).
- **Anular tiene motivo obligatorio** (`anular_movimiento`, constraint `anulacion_completa`): no se puede anular sin explicar por qué. Un movimiento que pertenece a una transferencia no se anula individualmente — hay que anular la transferencia completa (`anular_transferencia`), que anula sus dos movimientos vinculados atómicamente (y revierte todo si RLS impide anular alguno de los dos, p. ej. porque su sesión ya cerró y el usuario no tiene permiso de corrección).
- **Recalculo automático de arqueo:** si se anula (o inserta) un movimiento de una sesión que **ya está cerrada**, el trigger `recalcular_arqueo()` recalcula `monto_esperado` y `diferencia` de esa sesión automáticamente. Esto es lo que permite que un admin/cajero_general corrija un error después del cierre sin reabrir la sesión.
- Por RLS, solo `admin`/`cajero_general` pueden anular o insertar movimientos en una sesión ya cerrada (policy "corregir en sesion cerrada"); el resto de usuarios solo puede operar mientras la sesión está abierta.

## Transferencias entre cajas

- Una transferencia es un registro lógico (`transferencias`) que produce **dos movimientos vinculados**: un `egreso` en la caja origen y un `ingreso` en la caja destino, ambos con el mismo `transferencia_id` y sin `categoria_id`.
- `crear_transferencia()` exige que **ambas cajas tengan sesión abierta**; si alguna no la tiene, falla antes de insertar nada (todo o nada, dentro de la misma función — no hay estado intermedio con una sola pata creada).
- Constraint `cajas_distintas`: origen y destino no pueden ser la misma caja.
- Igual que los movimientos: **no se editan**, solo se anulan con motivo (`proteger_transferencia()`, constraint `anulacion_completa`). `anular_transferencia()` anula la transferencia y sus dos movimientos como una unidad.
- RLS de transferencias exige acceso a **ambas** cajas (origen y destino) tanto para crear como para anular.

## Nada se borra

- No hay políticas `delete` para `sesiones_caja`, `movimientos` ni `transferencias`. El histórico es permanente; los errores se corrigen con anulación + rastro (`anulado_at`, `anulado_por`, `motivo_anulacion`), nunca con un `DELETE`.
- `empresas` y `cajas` sí tienen `delete`, pero restringido a `admin` (empresas) o `admin`/encargado de esa empresa (cajas) — y las FKs usan `on delete restrict` desde `cajas`/`sesiones_caja`/`movimientos`, así que en la práctica no se puede borrar una empresa/caja con historial dependiente.

## Comprobantes (Storage)

- Bucket privado `comprobantes`. Cada archivo vive en la ruta `{caja_id}/{archivo}`.
- El acceso a un archivo se resuelve exactamente igual que el acceso a la caja (`puede_acceder_caja((storage.foldername(name))[1]::uuid)`), tanto para `select` como para `insert` — un solo punto de verdad de permisos entre datos y archivos.

## Categorías

- Catálogo global (no por empresa): cada fila es una operación concreta (p. ej. "Compra de Mercadería" / `egreso`). `unique (nombre, tipo)` evita duplicados dentro del mismo tipo.
- Visibles para todos los usuarios autenticados; solo `admin` las crea/edita/elimina.
