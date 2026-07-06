# Base de datos — Chambar

Explicación funcional del esquema (Supabase/Postgres). Para el detalle técnico ver [schema.sql](schema.sql); para las reglas de negocio ver [BUSINESS_RULES.md](BUSINESS_RULES.md); para los tipos ver [ENUMS.md](ENUMS.md); para el diagrama ver [ERD.md](ERD.md); para el porqué de las decisiones ver [decisions.md](decisions.md).

## ¿Qué es Chambar?

Un control de caja multiempresa: una organización maneja varias **empresas**, cada empresa tiene una o más **cajas** (un `stand` de venta o una caja `central`). Cada caja se opera en **sesiones**: se abre con un monto inicial, se registran **movimientos** (ingresos/egresos) durante el día, y se cierra con un arqueo (conteo físico vs. lo esperado por sistema).

## Tablas y su rol

| Tabla | Rol |
|---|---|
| `empresas` | Unidad de negocio de más alto nivel. Tiene color identificador para la UI (ver `diseno.md`, "lomo de color por empresa"). |
| `cajas` | Punto de cobro/pago dentro de una empresa. `tipo` distingue `stand` (campo) de `central` (oficina/bóveda). |
| `perfiles` | Espejo de `auth.users`, creado automáticamente por trigger al registrarse. Guarda `rol_global` y si el usuario está `activo`. |
| `asignaciones` | Tabla puente: qué encargado (perfil sin rol global) puede ver/operar qué empresa. |
| `categorias` | Catálogo global de tipos de operación (p. ej. "Venta", "Compra de Mercadería"), cada una atada a `ingreso` o `egreso`. |
| `sesiones_caja` | Un ciclo completo de apertura → cierre de una caja. Guarda el arqueo (esperado, contado, diferencia). |
| `movimientos` | Cada ingreso/egreso individual, siempre dentro de una sesión. |
| `transferencias` | Movimiento de dinero entre dos cajas; genera dos filas en `movimientos` (egreso + ingreso) vinculadas. |

## Cómo se relacionan (resumen)

```
empresas ──< cajas ──< sesiones_caja ──< movimientos >── categorias
   │                        │                  │
   └──< asignaciones >── perfiles ─────────────┘
                                │
                        transferencias ──< movimientos (2 filas)
```

Ver el diagrama completo en [ERD.md](ERD.md).

## Ideas clave para entender el diseño

1. **El saldo es siempre calculado, nunca guardado.** No busques una columna `saldo`; usa la vista `saldos_cajas` o replica su lógica (ver [BUSINESS_RULES.md](BUSINESS_RULES.md#el-saldo-nunca-se-almacena)).
2. **Nada se borra.** El historial de sesiones, movimientos y transferencias es permanente. Los errores se corrigen anulando (con motivo) y, si aplica, registrando uno nuevo.
3. **Los permisos viven en la base de datos**, no solo en la interfaz: RLS aplica en cada tabla según `rol_global` y `asignaciones` (ver [BUSINESS_RULES.md](BUSINESS_RULES.md#jerarquía-y-acceso)).
4. **Una caja abierta = una sesión abierta.** El estado "¿está abierta la caja?" se deriva de si existe una fila en `sesiones_caja` con `cierre_at is null` para esa caja (garantizado único por índice parcial).
5. La aplicación no hace `insert`/`update` directos sobre las tablas operativas para las acciones de negocio: usa los RPC `abrir_caja`, `cerrar_caja`, `registrar_movimiento`, `crear_transferencia`, `anular_movimiento`, `anular_transferencia` (todos en `docs/schema.sql`, sección de funciones). Esto centraliza la validación y evita saltarse las reglas de negocio desde el cliente.

## Dónde mirar según lo que necesites

- **"¿Puedo hacer X con este rol?"** → [BUSINESS_RULES.md](BUSINESS_RULES.md#jerarquía-y-acceso) + policies en `docs/schema.sql`.
- **"¿Qué significa este valor de enum?"** → [ENUMS.md](ENUMS.md).
- **"¿Cómo se relacionan estas tablas?"** → [ERD.md](ERD.md).
- **"¿Por qué se diseñó así y no de otra forma?"** → [decisions.md](decisions.md).
- **"Necesito el SQL exacto"** → [schema.sql](schema.sql) (referencia; la fuente ejecutable real es `supabase/migrations/`).
