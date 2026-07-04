# ERD — SCBox

Diagrama entidad-relación generado desde `docs/schema.sql`. No incluye `auth.users` (gestionada por Supabase) más que como referencia externa de `perfiles`.

```mermaid
erDiagram
    EMPRESAS ||--o{ CAJAS : "tiene"
    EMPRESAS ||--o{ ASIGNACIONES : "asignada en"
    PERFILES ||--o{ ASIGNACIONES : "asignado a"
    CAJAS ||--o{ SESIONES_CAJA : "abre"
    CAJAS ||--o{ MOVIMIENTOS : "registra"
    SESIONES_CAJA ||--o{ MOVIMIENTOS : "contiene"
    CATEGORIAS ||--o{ MOVIMIENTOS : "clasifica"
    PERFILES ||--o{ SESIONES_CAJA : "abre/cierra"
    PERFILES ||--o{ MOVIMIENTOS : "crea/anula"
    PERFILES ||--o{ TRANSFERENCIAS : "crea/anula"
    CAJAS ||--o{ TRANSFERENCIAS : "origen"
    CAJAS ||--o{ TRANSFERENCIAS : "destino"
    TRANSFERENCIAS ||--o{ MOVIMIENTOS : "genera 2"

    EMPRESAS {
        uuid id PK
        text nombre
        text ruc
        text color
        boolean activa
        timestamptz created_at
    }

    CAJAS {
        uuid id PK
        uuid empresa_id FK
        text nombre
        enum tipo "stand | central"
        boolean activa
        timestamptz created_at
    }

    PERFILES {
        uuid id PK "= auth.users.id"
        text nombre
        text email UK
        enum rol_global "admin | cajero_general | null"
        boolean activo
        timestamptz created_at
    }

    ASIGNACIONES {
        uuid usuario_id PK_FK
        uuid empresa_id PK_FK
        timestamptz created_at
    }

    CATEGORIAS {
        uuid id PK
        text nombre
        enum tipo "ingreso | egreso"
        text descripcion
        text icono
        text color
        boolean activa
    }

    SESIONES_CAJA {
        uuid id PK
        uuid caja_id FK
        timestamptz apertura_at
        numeric monto_apertura
        text observaciones_apertura
        timestamptz cierre_at
        numeric monto_esperado
        numeric monto_contado
        numeric diferencia
        text observaciones_cierre
        uuid abierta_por FK
        uuid cerrada_por FK
    }

    TRANSFERENCIAS {
        uuid id PK
        uuid caja_origen_id FK
        uuid caja_destino_id FK
        numeric monto
        text descripcion
        uuid creado_por FK
        timestamptz created_at
        timestamptz anulado_at
        uuid anulado_por FK
        text motivo_anulacion
    }

    MOVIMIENTOS {
        uuid id PK
        uuid caja_id FK
        uuid sesion_id FK
        enum tipo "ingreso | egreso"
        numeric monto
        uuid categoria_id FK
        text descripcion
        text comprobante_url
        timestamptz fecha
        uuid creado_por FK
        uuid transferencia_id FK
        timestamptz anulado_at
        uuid anulado_por FK
        text motivo_anulacion
    }
```

## Notas de lectura

- `ASIGNACIONES` es la tabla puente que define qué "encargado" (perfil con `rol_global is null`) ve qué empresas. `admin` y `cajero_general` no necesitan filas aquí: su acceso es global vía `puede_operar_todas()`.
- `MOVIMIENTOS.transferencia_id` es opcional: null en movimientos normales, presente en los 2 movimientos generados por una `TRANSFERENCIAS`.
- No hay tabla de "saldos": el saldo por caja es la vista calculada `saldos_cajas` (ver [BUSINESS_RULES.md](BUSINESS_RULES.md#el-saldo-nunca-se-almacena)), por eso no aparece en este ERD como entidad con columnas propias más allá de ser una proyección de `CAJAS` + `SESIONES_CAJA` + `MOVIMIENTOS`.
