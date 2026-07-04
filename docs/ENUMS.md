# Enums — SCBox

Tipos definidos en `supabase/migrations/20260702100001_esquema_inicial.sql`.

## `tipo_caja`

| Valor | Significado |
|---|---|
| `stand` | Caja de un punto de venta / stand. Puede estar asociada a operación diaria de campo. |
| `central` | Caja central de la empresa (oficina/bóveda). Recibe transferencias de los stands. |

Usado en `cajas.tipo`.

## `tipo_movimiento`

| Valor | Significado |
|---|---|
| `ingreso` | Entrada de dinero a la caja. Suma al saldo. |
| `egreso` | Salida de dinero de la caja. Resta al saldo. |

Usado en `movimientos.tipo` y `categorias.tipo`. La categoría de un movimiento debe coincidir con su tipo (ver `validar_movimiento()` en [BUSINESS_RULES.md](BUSINESS_RULES.md)). Las transferencias generan un movimiento `egreso` (origen) y uno `ingreso` (destino) sin categoría.

## `rol_global`

| Valor | Significado |
|---|---|
| `admin` | Control total: gestiona empresas, cajas, categorías, perfiles y asignaciones; puede corregir sesiones/movimientos cerrados. |
| `cajero_general` | Opera (ve y registra en) todas las cajas de todas las empresas, sin necesidad de asignación explícita. No administra empresas/categorías/perfiles. |
| `NULL` | "Encargado de empresa": rol implícito cuando `rol_global` es nulo. Su acceso se define por filas en `asignaciones`, no por este enum. Ver [BUSINESS_RULES.md](BUSINESS_RULES.md). |

Usado en `perfiles.rol_global`. Ver [decisions.md](decisions.md) sobre por qué el tercer rol no es un valor explícito del enum.
