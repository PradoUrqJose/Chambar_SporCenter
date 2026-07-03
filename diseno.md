# Plan de diseño — SCBox

**Concepto: "Esmeralda contable"** — el libro contable clásico y la mesa de conteo de efectivo, modernizados. Verde botella profundo, papel hueso, acentos de cobre. Serio y confiable, pero con firma propia: sellos de arqueo, boletas térmicas y billetes que se cuentan tocando.

---

## 1. Paleta

### Modo claro (por defecto)

| Token | Valor | Uso |
|---|---|---|
| Fondo | `#F4F3EE` (hueso) | Fondo general de la app |
| Superficie | `#FFFFFF` | Tarjetas, hojas, modales |
| Superficie tinta | `#123B2E` (verde botella) | Header, hero de saldos, sidebar PC |
| Texto | `#1C2B25` | Texto principal |
| Texto suave | `#5C6B63` | Etiquetas, metadatos |
| Primario | `#1E6B4F` (esmeralda) | Botones, enlaces, foco |
| Acento | `#C77B4A` (cobre) | CTA de arqueo, resaltados, saldo destacado |
| Ingreso | `#2F9E70` | Montos positivos, badges de ingreso |
| Egreso | `#B04246` (granate) | Montos negativos, badges de egreso |
| Advertencia | `#B8860B` | Diferencias de arqueo pendientes |
| Borde | `#DDDCD3` | Bordes de tarjetas y tablas |

### Modo oscuro

| Token | Valor | Uso |
|---|---|---|
| Fondo | `#0D2A20` | Fondo general (verde botella casi negro) |
| Superficie | `#123B2E` | Tarjetas |
| Superficie elevada | `#1A4A3A` | Modales, hojas |
| Texto | `#EDEBE3` | Texto principal |
| Texto suave | `#93A69C` | Etiquetas |
| Primario | `#3DAF7E` | Botones, enlaces |
| Acento | `#D98F5F` (cobre claro) | CTA, saldos destacados |
| Ingreso | `#43C98B` | Montos positivos |
| Egreso | `#E06A6E` | Montos negativos |
| Borde | `#22523F` | Bordes |

**Degradados (con moderación):** solo en dos lugares — el hero del saldo (`#123B2E → #1E6B4F`, diagonal suave) y el fondo del header. Nunca en botones ni texto.

**Regla de color por semántica:** ingreso siempre verde con `+`, egreso siempre granate con `−`, nunca solo color (accesibilidad). El cobre se reserva para dinero físico: arqueos, saldos, CTA de cierre.

---

## 2. Tipografía

| Rol | Fuente | Detalles |
|---|---|---|
| Texto e interfaz | **Instrument Sans** (Google Fonts, via `next/font`) | 400 / 500 / 600; titulares en 600 con tracking apretado (−0.02em) |
| Montos, fechas, códigos | **JetBrains Mono** (Google Fonts, via `next/font`) | 400 / 700; TODOS los montos en mono — columnas de dígitos perfectamente alineadas |

Reglas:
- Montos siempre `S/ 1,240.50` — símbolo pegado, 2 decimales, separador de miles.
- El monto es el protagonista: en tarjetas de caja va más grande que el nombre de la caja.
- Egresos con `−` explícito delante, ingresos con `+` en listados mixtos.

---

## 3. Elementos distintivos (la firma de SCBox)

### 3.1 Sello de arqueo
Cada sesión cerrada muestra un sello tipo tampón de tinta, rotado −3°, borde doble, mayúsculas en mono:
- `CUADRADA ✓` — esmeralda
- `FALTANTE S/ 12.00` — granate
- `SOBRANTE S/ 5.00` — cobre

Al cerrar caja, el sello "se estampa" con animación (aparece grande y translúcido, cae al tamaño real con un rebote corto). Es el momento emocional del día del encargado.

### 3.2 Estética de ticket
El detalle de sesión y el historial usan tarjetas-boleta: borde superior e inferior dentado (zigzag CSS), separadores de líneas punteadas, números en mono, encabezado tipo `*** ARQUEO DE CIERRE ***`. El historial navegable se siente como hojear las boletas del día.

### 3.3 Lomo de color por empresa
Toda tarjeta o pantalla de una empresa lleva una franja izquierda de 4px con su color (`empresas.color`, ya en BD). En el consolidado del admin, cada bloque se reconoce de un vistazo.

### 3.4 Chips de denominaciones
En apertura y arqueo: botones con forma de billete (S/ 200, 100, 50, 20, 10 — rectángulos con su color aproximado real) y moneda (S/ 5, 2, 1, 0.50, 0.20, 0.10 — círculos). Tocar suma, mantener presionado resta; el total se calcula en vivo y llena el monto contado. Contar sin calculadora. *(El desglose no se persiste — decisión de BD; el chip es una calculadora de UI.)*

### 3.5 Movimiento
Animaciones discretas de 150–250 ms (ease-out): entrada de tarjetas en cascada corta, transición de saldo cuando cambia (contador que rueda), estampado del sello. Nada que retrase un registro: en el flujo de movimiento, cero animaciones bloqueantes.

---

## 4. Aplicación por pantalla

- **Login**: fondo verde botella con degradado sutil, tarjeta hueso centrada, logo tipográfico "SCBox" en Instrument Sans 600.
- **Inicio (consolidado)**: hero con degradado esmeralda y el total general en mono grande; debajo, tarjetas por empresa con su lomo de color.
- **Caja (celular, mínimos toques)**: saldo arriba en mono grande sobre degradado; dos botones gigantes `+ INGRESO` (esmeralda) / `− EGRESO` (granate); categorías como chips grandes con icono/color del catálogo.
- **Cierre/arqueo**: chips de denominaciones → total contado en vivo → diferencia calculada → botón cobre `CERRAR CAJA` → sello estampado.
- **Historial**: línea de tiempo de tickets, cada uno con su sello de arqueo.
- **Reportes (PC)**: tablas densas con montos en mono alineados a la derecha, totales con borde doble superior (como suma contable).

---

## 5. Implementación técnica

- Tokens como variables CSS de shadcn/ui (`--primary`, `--accent`, etc.) en `globals.css`, tema claro/oscuro con `next-themes` (selector en ajustes, claro por defecto).
- Fuentes con `next/font/google` (subset `latin`, `display: swap`).
- Componentes distintivos propios: `<Sello>`, `<Ticket>`, `<LomoEmpresa>`, `<ContadorDenominaciones>`, `<Monto>` (formatea S/ y aplica mono + color semántico).
- Animaciones con CSS transitions + `tailwindcss-animate`; el sello con keyframes propios.
