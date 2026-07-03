# Plan de SCBox — Control de Caja Multiempresa

## Estructura y roles

```text
Organización
 └── Empresa (caja central propia)
      └── Stand (caja propia)
```

| Acción | Admin general | Encargado general de cajas | Encargado de empresa |
|--------|---------------|----------------------------|----------------------|
| Ver historiales y saldos | Todo | Todas las cajas | Solo su(s) empresa(s) |
| Abrir/cerrar cajas (arqueo) | ✅ | ✅ Todas | ✅ Las de su empresa |
| Registrar movimientos y transferencias | ✅ | ✅ Todas | ✅ Su empresa |
| Editar/eliminar en período abierto | ✅ | ✅ | ✅ Su empresa |
| Corregir períodos ya cerrados | ✅ | ✅ | ❌ |
| Gestionar empresas, usuarios y asignaciones | ✅ | ❌ | ❌ |
| Gestionar stands/cajas de una empresa | ✅ | ❌ | ✅ Su empresa |
| Categorías (catálogo global) | ✅ | ❌ | ❌ |

> Los usuarios **no se registran solos**. El administrador general los crea y los asigna a una o varias empresas. Todos estos permisos se aplican directamente en la base de datos mediante **Row Level Security (RLS)** de Supabase, no únicamente desde la interfaz.

---

# Cómo funciona la caja día a día

## 1. Apertura

El encargado abre la caja indicando el monto inicial contado.

## 2. Movimientos

Se registran ingresos y egresos en soles, indicando:

- Categoría global
- Descripción
- Usuario que realizó el registro

## 3. Transferencias vinculadas

Al mover efectivo entre cajas (por ejemplo, **Stand → Caja Central**), un único registro genera:

- Un egreso en la caja origen.
- Un ingreso en la caja destino.

Ambos movimientos quedan vinculados entre sí, evitando pérdida o duplicidad de dinero.

## 4. Cierre con arqueo

Al finalizar la jornada:

- Se cuenta el efectivo real.
- El sistema calcula el monto esperado.

```
Monto esperado =
Apertura + Ingresos − Egresos
```

También registra:

- Monto contado
- Diferencia (faltante o sobrante)

Todo queda almacenado para auditoría.

## 5. Historial navegable

Cada caja mantiene una línea de tiempo compuesta por sesiones:

```
Apertura
   ↓
Movimientos
   ↓
Transferencias
   ↓
Cierre
```

El usuario puede navegar sesión por sesión y consultar todos los movimientos y arqueos realizados.

---

# Modelo de datos

```text
empresas
---------
id
nombre
activa

cajas
------
id
empresa_id
nombre
tipo ('stand' | 'central')

perfiles
---------
id (auth.users)
nombre
email
rol_global ('admin' | 'cajero_general' | null)

asignaciones
-------------
usuario_id
empresa_id

categorias
-----------
id
nombre
tipo ('ingreso' | 'egreso')
activa

sesiones_caja
--------------
id
caja_id
apertura_at
monto_apertura
cierre_at
monto_esperado
monto_contado
diferencia
abierta_por
cerrada_por

movimientos
------------
id
caja_id
sesion_id
tipo
monto
categoria_id
descripcion
fecha
creado_por
transferencia_id
```

> **Importante:** El saldo nunca se almacena en la base de datos. Siempre se calcula a partir de los movimientos registrados, evitando inconsistencias o desincronizaciones.

---

# Pantallas

## 1. Login

Usuarios creados por el administrador.

## 2. Inicio

Según el rol:

- **Administrador General**
  - Consolidado de toda la organización.
- **Encargado General de Cajas**
  - Consolidado de todas las empresas.
- **Encargado de Empresa**
  - Visualiza únicamente sus empresas asignadas.

## 3. Empresa

Visualiza:

- Cajas centrales
- Stands
- Saldo actual
- Estado (Abierta / Cerrada)

## 4. Caja

Permite:

- Ver sesión actual
- Registrar movimiento
- Realizar transferencias
- Abrir caja
- Cerrar caja con arqueo

Diseñada para requerir la menor cantidad posible de toques desde un celular.

## 5. Historial

Historial navegable por sesiones.

Cada cierre permite acceder al detalle completo de:

- Movimientos
- Transferencias
- Arqueo

## 6. Reportes

- Consolidado general
- Por empresa
- Por categoría
- Por período

Exportación a:

- Excel
- CSV

## 7. Administración

Gestión de:

- Empresas
- Cajas
- Stands
- Usuarios
- Asignaciones
- Categorías

---

# Diseño

- Responsive.
- Optimizado para celular al registrar movimientos.
- Optimizado para PC al revisar historiales y reportes.
- Todo en español.
- Moneda en **S/.**

---

# Stack tecnológico

- **Frontend:** Next.js
- **UI:** Tailwind CSS + shadcn/ui
- **Hosting:** Vercel (Hobby)
- **Backend / Base de datos:** Supabase
  - PostgreSQL
  - Autenticación
  - Row Level Security (RLS)

## Costo

**S/ 0 al mes**

Solo será necesario crear una cuenta gratuita en Supabase cuando llegue ese paso del desarrollo.

---

# Orden de construcción

1. Scaffold del proyecto + esquema de base de datos con RLS.
2. Login, roles y estructura (empresas, stands, cajas y asignaciones).
3. Sesiones de caja:
   - Apertura
   - Movimientos
   - Cierre con arqueo
4. Transferencias vinculadas.
5. Historial navegable por caja.
6. Reportes y exportación a Excel/CSV.
7. Panel de administración y despliegue en Vercel.