# Plan de implementación — SCBox

> **Documento de traspaso.** Toda la planificación y las decisiones ya fueron consensuadas con el usuario. Quien implemente (este documento está escrito para que un agente pueda codificar sin re-decidir nada) debe seguirlo tal cual. Los documentos hermanos son `plan.md` (producto) y `diseno.md` (diseño visual — LEERLO antes de escribir cualquier UI).

---

## 0. Cómo trabajar con el usuario (OBLIGATORIO)

- Todo en **español** (conversación, UI, commits descriptivos).
- El usuario quiere **consenso paso a paso**: antes de cada fase, presentar brevemente lo que se va a hacer; si surge una decisión NO cubierta por este documento, **preguntar con AskUserQuestion** antes de codificar. Un timeout de pregunta NO es luz verde: esperar la respuesta.
- No commitear ni pushear sin que el usuario lo pida.
- No usar los looks genéricos de IA (crema+terracota, negro+verde ácido, estilo periódico). El diseño ya está definido en `diseno.md`: seguirlo al pie de la letra.

## 1. Estado actual (ya hecho, NO repetir)

- **BD remota lista y verificada**: proyecto Supabase `nigofeldnmrihmdsaypk` (región São Paulo). Las 3 migraciones de `supabase/migrations/` están aplicadas. La CLI de Supabase v2.109 está instalada (Scoop) y el proyecto vinculado.
- **No hay Docker** → no hay BD local. Todo cambio de BD = nueva migración en `supabase/migrations/` + `supabase db push -p '<contraseña>'` (la contraseña de BD la tiene el usuario; pedírsela, no está guardada).
- `supabase/seed.sql` NO se aplica al remoto (es solo para BD local que no existe). Para datos de prueba en remoto, ver §7 Fase 2.
- Git inicializado, **sin commits aún**.
- Usuario admin: `josepu03@gmail.com` — el trigger `handle_new_user` le asigna rol `admin` automáticamente cuando se cree su cuenta (invitación o alta manual en el dashboard).

## 2. Stack y decisiones cerradas

| Tema | Decisión |
|---|---|
| Framework | Next.js (App Router, TypeScript, Tailwind) en la **raíz de este repo** |
| UI | Tailwind + shadcn/ui, tokens de `diseno.md`, claro por defecto + oscuro con selector (`next-themes`) |
| Fuentes | Instrument Sans (texto) + JetBrains Mono (todos los montos), vía `next/font/google` |
| Auth | Supabase Auth email+contraseña, **con** "olvidé mi contraseña". Los usuarios NO se registran solos: el admin los invita por email (definen su contraseña al aceptar) |
| Navegación | Móvil: barra inferior de 5 pestañas (Inicio, Cajas, Historial, Reportes, Ajustes). PC: sidebar izquierda. Sección Admin visible solo para rol admin |
| PWA | Sí: instalable (manifest + iconos). Offline fuera de alcance |
| Moneda/fechas | `S/ 1,240.50` (siempre 2 decimales, miles con coma), locale `es-PE`, zona horaria `America/Lima` |
| Paquetes | npm |
| Hosting | Vercel (Hobby) al final |

## 3. Referencia de la BD (lo que la app consume)

### Tablas (RLS activo en todas)

- `empresas(id, nombre, ruc, color, activa, created_at)`
- `cajas(id, empresa_id, nombre, tipo 'stand'|'central', activa, created_at)`
- `perfiles(id=auth.users, nombre, email, rol_global 'admin'|'cajero_general'|null, activo, created_at)` — legible por todos los autenticados (para mostrar quién registró)
- `asignaciones(usuario_id, empresa_id, created_at)` — empresas de cada encargado
- `categorias(id, nombre, tipo 'ingreso'|'egreso', descripcion, icono, color, activa)` — catálogo global, **empieza vacío en producción**
- `sesiones_caja(id, caja_id, apertura_at, monto_apertura, observaciones_apertura, cierre_at, monto_esperado, monto_contado, diferencia, observaciones_cierre, abierta_por, cerrada_por)`
- `transferencias(id, caja_origen_id, caja_destino_id, monto, descripcion, creado_por, created_at, anulado_at, anulado_por, motivo_anulacion)`
- `movimientos(id, caja_id, sesion_id, tipo, monto, categoria_id, descripcion, comprobante_url, fecha, creado_por, transferencia_id, anulado_at, anulado_por, motivo_anulacion)`

### Vista

- `saldos_cajas(caja_id, empresa_id, nombre, tipo, activa, abierta bool, sesion_abierta_id, apertura_at, saldo)` — saldo de caja abierta = apertura + neto de la sesión; cerrada = contado del último arqueo. RLS del usuario aplica (security invoker). **Usarla siempre para mostrar saldos**; también da la sugerencia de monto de apertura (el saldo de una caja cerrada ES el último contado).

### RPC (la app opera SIEMPRE por estas funciones, nunca insert/update directo en sesiones/movimientos/transferencias)

| Función | Firma | Notas |
|---|---|---|
| `abrir_caja` | `(p_caja_id uuid, p_monto_apertura numeric, p_observaciones text default null) → uuid` | Error si ya hay sesión abierta |
| `cerrar_caja` | `(p_sesion_id uuid, p_monto_contado numeric, p_observaciones text default null) → sesiones_caja` | Calcula esperado y diferencia |
| `registrar_movimiento` | `(p_caja_id uuid, p_tipo, p_monto numeric, p_categoria_id uuid, p_descripcion text default null, p_comprobante_url text default null) → uuid` | Error si no hay sesión abierta; el tipo debe coincidir con el de la categoría |
| `crear_transferencia` | `(p_caja_origen_id uuid, p_caja_destino_id uuid, p_monto numeric, p_descripcion text default null) → uuid` | Atómica; exige sesión abierta en AMBAS cajas |
| `anular_movimiento` | `(p_movimiento_id uuid, p_motivo text) → void` | Motivo obligatorio; rechaza movimientos de transferencia (usar la siguiente) |
| `anular_transferencia` | `(p_transferencia_id uuid, p_motivo text) → void` | Anula la transferencia y sus 2 movimientos |

### Reglas que la UI debe respetar (la BD las impone igualmente)

- **Nada se edita ni borra**: "editar" un movimiento = `anular_movimiento` + `registrar_movimiento` nuevo (un trigger bloquea cambios de monto/tipo/categoría; solo descripción y comprobante son editables por UPDATE directo). No existen botones "Eliminar".
- Los movimientos **anulados se muestran** tachados/atenuados con su motivo — no se ocultan (auditoría).
- Correcciones en sesiones cerradas: solo admin y cajero_general (RLS lo impone); al anular en sesión cerrada, el arqueo se **recalcula solo** (trigger).
- Los mensajes de error de las RPC ya vienen en español → mostrarlos tal cual en toasts.
- Permisos por rol (ocultar en UI lo que RLS negaría): ver tabla en `plan.md`. Regla rápida: `admin` todo; `cajero_general` ve/opera todas las cajas pero NO administra nada; encargado (rol null) ve/opera/gestiona-cajas solo de sus empresas asignadas.

## 4. Setup del proyecto (Fase 1a)

1. El directorio ya tiene archivos (`plan.md`, `diseno.md`, `supabase/`, `.git`), y `create-next-app` exige carpeta vacía → scaffold en carpeta temporal y mover a la raíz:
   ```powershell
   npx create-next-app@latest scbox-tmp --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
   # mover TODO el contenido de scbox-tmp (incluidos .gitignore, etc.) a la raíz, fusionando; eliminar scbox-tmp
   ```
   Fusionar `.gitignore` (mantener lo de Next.js; añadir nada de supabase: su `.gitignore` propio ya existe en `supabase/`).
2. `npx shadcn@latest init` y agregar componentes según se necesiten (button, card, input, form, dialog, sheet, tabs, badge, table, select, sonner…).
3. Instalar: `@supabase/supabase-js @supabase/ssr next-themes`.
4. `.env.local` (NUNCA commitear):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://nigofeldnmrihmdsaypk.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<pedir al usuario: dashboard → Settings → API keys (anon/publishable)>
   ```
5. Clientes Supabase patrón `@supabase/ssr`: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server components/actions), `middleware.ts` con refresh de sesión + protección de rutas (todo requiere login salvo `/login`, `/recuperar` y callbacks de auth).
6. Fuentes + tokens CSS de `diseno.md` en `app/globals.css` (variables shadcn `--primary`, `--accent`, etc. para ambos modos), `ThemeProvider` de next-themes (claro por defecto).
7. PWA: `app/manifest.ts` (name SCBox, colores del tema, display standalone) + iconos generados (esmeralda con "S/" en mono, 192/512 px).

## 5. Arquitectura frontend

```
app/
  (auth)/login, (auth)/recuperar          → públicas, layout centrado verde botella
  (app)/                                  → layout con nav (tabs móvil / sidebar PC) + perfil cargado
    inicio/                               → consolidado según rol
    cajas/                                → lista de cajas accesibles (agrupadas por empresa)
    cajas/[id]/                           → pantalla de operación de caja
    cajas/[id]/historial/                 → sesiones pasadas (tickets)
    reportes/
    ajustes/                              → tema, cuenta, cerrar sesión
    admin/ (empresas|cajas|usuarios|categorias)  → solo rol admin
componentes clave:
  <Monto valor tipo?>       → formatea S/, JetBrains Mono, color semántico (+verde/−granate)
  <Sello resultado>         → tampón CUADRADA/FALTANTE/SOBRANTE (ver diseno.md §3.1)
  <Ticket>                  → tarjeta-boleta dentada (diseno.md §3.2)
  <LomoEmpresa color>       → franja izquierda 4px
  <ContadorDenominaciones onTotal>  → chips billetes/monedas; SOLO calculadora de UI, el desglose no se guarda
```

- Lecturas en server components; mutaciones con RPC desde el cliente (o server actions) + `router.refresh()`.
- El perfil (`perfiles` + `rol_global`) se carga una vez en el layout `(app)` y se pasa por contexto; de él dependen navegación y botones visibles.
- Formato: helper `formatearMonto(n)` y `formatearFecha(d)` centralizados (es-PE, America/Lima).

## 6. Nota especial: invitar usuarios (Fase 7)

`inviteUserByEmail` requiere la **service_role key** → SOLO en servidor: server action / route handler con `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` (sin `NEXT_PUBLIC_`). Pedir la key al usuario recién en esa fase. Verificar además en el servidor que quien invoca es admin (leer su perfil), porque esa key salta RLS. Flujo: admin escribe nombre + email → invitación → el usuario define contraseña vía link → trigger crea su perfil → admin lo asigna a empresas en `asignaciones`.

## 7. Fases (cada una termina con verificación y visto bueno del usuario)

**Fase 1 — Base + Login.** Setup completo (§4), layout de navegación (tabs/sidebar, tema, fuentes), login con recuperación de contraseña, middleware, página de inicio placeholder con el perfil y rol visibles. *Prueba: el usuario se crea a sí mismo desde el dashboard de Supabase (Authentication → Add user → invite `josepu03@gmail.com`) o pedirle que lo haga; su perfil debe nacer admin.*

**Fase 2 — Estructura y consolidado.** Datos de prueba en remoto: pegar en el SQL Editor del dashboard los inserts de `supabase/seed.sql` (empresas/cajas/categorías de prueba; el usuario los borrará antes de producción). Pantalla Inicio con: saldo consolidado (hero degradado), estado de cajas (abiertas/cerradas con acceso directo), últimos movimientos, alertas de arqueo (diferencias ≠ 0 recientes), resumen del día (ingresos/egresos de hoy). Lista de Cajas agrupada por empresa con `<LomoEmpresa>` y saldos de `saldos_cajas`.

**Fase 3 — Operación de caja.** Pantalla caja: abrir (monto sugerido = saldo actual de la vista, editable, con `<ContadorDenominaciones>` opcional), registrar movimiento con MÍNIMOS toques (botones gigantes `+ INGRESO`/`− EGRESO`, chips de categorías del catálogo filtradas por tipo, monto, descripción opcional, foto/PDF de comprobante opcional → Supabase Storage bucket `comprobantes` privado con política por acceso a caja), cerrar con arqueo (`<ContadorDenominaciones>` → contado, muestra esperado/diferencia en vivo, `<Sello>` estampado al confirmar). Anular movimiento con motivo obligatorio (dialog).

**Fase 4 — Transferencias.** Formulario origen→destino (solo cajas abiertas accesibles), `crear_transferencia`, visualización vinculada en ambas cajas (icono ⇄), anulación completa con motivo.

**Fase 5 — Historial.** Por caja: línea de tiempo de sesiones (tickets con sello), navegación sesión por sesión, detalle completo (apertura, movimientos con anulados visibles, transferencias, arqueo, observaciones).

**Fase 6 — Reportes + export.** Consolidado, por empresa, por categoría, por período (rango de fechas). Tablas densas para PC (totales con doble raya contable). Export CSV (BOM UTF-8) y Excel (librería `xlsx`), generados en el cliente.

**Fase 7 — Admin + PWA + Deploy.** CRUD empresas (con color — usarlo en lomos), cajas, categorías (con icono/color), usuarios (invitación §6, activar/desactivar) y asignaciones. Pulido PWA (iconos, splash). Deploy a Vercel: el usuario conecta el repo (necesitará subirlo a GitHub — preguntarle) y se configuran las env vars en Vercel. Recordarle borrar los datos de prueba y crear sus empresas/categorías reales.

## 8. Trampas conocidas del entorno

- **PowerShell 5.1**: no existe `&&` — encadenar con `;` o `if ($?)`.
- `create-next-app` interactivo puede colgarse: pasar TODOS los flags (§4.1).
- Las claves nuevas de Supabase pueden llamarse "publishable" en vez de "anon" — es la misma para `createBrowserClient`.
- Si una RPC devuelve error de permiso o de regla (ej. "La caja ya tiene una sesión abierta"), es la BD funcionando: mostrar el mensaje, no "arreglarlo" con service_role.
- Cambios de esquema: SIEMPRE nueva migración con timestamp + `supabase db push -p '<contraseña>'` (pedir contraseña al usuario), nunca editar migraciones ya aplicadas ni tocar la BD por el dashboard.
