# Decisiones de arquitectura — Base de datos Chambar

Registro de *por qué* el esquema quedó así, no solo *qué* hace. Fuente: `plan.md`, comentarios en `supabase/migrations/`.

## El saldo se calcula, nunca se almacena

**Decisión:** no existe columna `saldo` en `cajas`; se deriva siempre de `monto_apertura` + movimientos no anulados (sesión abierta) o del `monto_contado` del último arqueo (caja cerrada), expuesto vía la vista `saldos_cajas`.

**Por qué:** un saldo guardado se puede desincronizar de su fuente (bug, carrera, edición manual). Calcularlo siempre desde `movimientos` hace imposible que el saldo mienta — es una proyección, no un dato independiente que pueda quedar desactualizado.

## Nada se borra; todo se anula con motivo

**Decisión:** `sesiones_caja`, `movimientos` y `transferencias` no tienen política de `delete`. Los movimientos/transferencias solo se anulan (`anulado_at`, `anulado_por`, `motivo_anulacion` obligatorio) o se corrigen en campos no sensibles; cambiar monto/tipo/categoría exige anular + crear uno nuevo (forzado por el trigger `proteger_movimiento`).

**Por qué:** es un sistema de control de caja — el requisito no es "tener el número correcto ahora" sino "poder auditar cómo se llegó a él". Permitir `UPDATE`/`DELETE` libre sobre montos históricos rompe esa trazabilidad. El motivo obligatorio en la anulación fuerza a que cada corrección quede documentada, no solo registrada.

## Permisos en la base de datos (RLS), no solo en la interfaz

**Decisión:** cada tabla tiene RLS habilitado con policies basadas en funciones `security definer` (`es_admin`, `puede_operar_todas`, `esta_asignado`, `puede_acceder_empresa`, `puede_acceder_caja`).

**Por qué:** múltiples encargados con acceso restringido a sus propias empresas; si el control de acceso viviera solo en el frontend, cualquier llamada directa a la API de Supabase (o un bug de UI) expondría datos de otras empresas. Al vivir en RLS, la restricción aplica sin importar por dónde llegue la query.

**Por qué `security definer`:** las funciones de permiso necesitan leer `perfiles`/`asignaciones` para decidir; si esas tablas también tienen RLS (la tienen), una función normal quedaría atrapada evaluando la policy de la tabla que a su vez llama a la función → recursión. `security definer` rompe ese ciclo evaluando con privilegios del dueño de la función, no del caller.

## Tres niveles de rol, pero el enum solo modela dos

**Decisión:** `rol_global` es `admin | cajero_general | NULL`. El "encargado de empresa" no es un valor del enum — es lo que significa `rol_global is null` combinado con filas en `asignaciones`.

**Por qué:** los dos roles globales (`admin`, `cajero_general`) son binarios y no dependen de datos externos: se es o no se es. El tercer nivel, en cambio, es inherentemente relacional (depende de *qué* empresas), así que modelarlo como una tabla puente (`asignaciones`) es más correcto que forzarlo a un valor de enum sin datos asociados. Ver `plan.md` para la tabla completa de permisos por rol.

## Transferencias como registro doble vinculado, no como movimiento único

**Decisión:** `transferencias` es su propia tabla; `crear_transferencia()` inserta un registro en `transferencias` y **dos** filas en `movimientos` (egreso origen + ingreso destino) con el mismo `transferencia_id`, sin categoría.

**Por qué:** un movimiento entre dos cajas necesita aparecer en el historial de *ambas* cajas de forma consistente (para que cada caja pueda calcular su propio saldo correctamente), pero también necesita poder anularse como una sola operación atómica (no tendría sentido anular el egreso sin anular el ingreso correspondiente — se perdería o duplicaría dinero). De ahí que `anular_transferencia()` anule los dos movimientos a la vez, revirtiendo todo si RLS impide anular alguno.

## Corrección post-cierre en vez de reapertura de sesión

**Decisión:** una sesión cerrada no se reabre. En su lugar, `admin`/`cajero_general` pueden anular o insertar movimientos en una sesión cerrada (permitido por policy), y el trigger `recalcular_arqueo()` recalcula automáticamente `monto_esperado`/`diferencia` de esa sesión cuando eso ocurre.

**Por qué:** reabrir una sesión cerrada complica el estado ("¿está abierta o cerrada esta caja ahora mismo?", rompe el índice único de sesión abierta, invalida el arqueo ya hecho). Permitir una corrección puntual con recálculo automático da el mismo resultado práctico (el arqueo queda correcto) sin tocar la máquina de estados de apertura/cierre ni requerir un segundo arqueo manual.

## Categorías como catálogo global, no por empresa

**Decisión:** `categorias` no tiene `empresa_id`; es un catálogo único para toda la organización, gestionado solo por `admin`.

**Por qué:** mantiene los reportes "por categoría" comparables entre empresas (ver `plan.md`, pantalla de Reportes) y evita que cada encargado invente su propia taxonomía. El costo (menos flexibilidad por empresa) se acepta a cambio de consistencia en los reportes consolidados.

## RPC de negocio en vez de INSERT/UPDATE directos desde el cliente

**Decisión:** las acciones de negocio (`abrir_caja`, `cerrar_caja`, `registrar_movimiento`, `crear_transferencia`, `anular_movimiento`, `anular_transferencia`) son funciones Postgres `security invoker`, no operaciones CRUD directas desde el cliente sobre las tablas.

**Por qué:** varias de estas acciones tienen múltiples pasos con invariantes que cruzan tablas (p. ej. una transferencia son 2 inserts atómicos; un cierre de caja calcula el esperado en el mismo momento en que se congela). Encapsularlas en funciones evita que el cliente tenga que replicar esa lógica (y evita que la olvide o la implemente distinto en dos pantallas).
