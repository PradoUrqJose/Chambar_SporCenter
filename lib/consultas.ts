import { createClient } from "@/lib/supabase/server";
import type { RolGlobal } from "@/lib/roles";

const ZONA_HORARIA = "America/Lima";
const OFFSET_LIMA = "-05:00";
const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const formateadorFecha = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_HORARIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function fechaLima(offsetDias = 0): string {
  const fecha = new Date(Date.now() + offsetDias * 24 * 60 * 60 * 1000);
  return formateadorFecha.format(fecha);
}

export function limitesDelDia(fechaISO: string) {
  return {
    inicio: `${fechaISO}T00:00:00${OFFSET_LIMA}`,
    fin: `${fechaISO}T23:59:59.999${OFFSET_LIMA}`,
  };
}

export async function obtenerSaldoConsolidado(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("saldos_cajas")
    .select("saldo")
    .eq("activa", true);

  return (data ?? []).reduce((total, fila) => total + Number(fila.saldo), 0);
}

export async function obtenerMovimientosHoy(): Promise<{
  ingresos: number;
  egresos: number;
}> {
  const supabase = await createClient();
  const { inicio, fin } = limitesDelDia(fechaLima());

  const { data } = await supabase
    .from("movimientos")
    .select("tipo, monto")
    .not("categoria_id", "is", null)
    .is("anulado_at", null)
    .gte("fecha", inicio)
    .lte("fecha", fin);

  return (data ?? []).reduce(
    (acumulado, movimiento) => {
      const clave = movimiento.tipo === "ingreso" ? "ingresos" : "egresos";
      acumulado[clave] += Number(movimiento.monto);
      return acumulado;
    },
    { ingresos: 0, egresos: 0 },
  );
}

export type FlujoDia = { dia: string; fecha: string; ingresos: number; egresos: number };

export async function obtenerFlujoSemanal(cajaId?: string): Promise<FlujoDia[]> {
  const supabase = await createClient();
  const dias = Array.from({ length: 6 }, (_, i) => fechaLima(i - 5));

  const { inicio } = limitesDelDia(dias[0]);
  const { fin } = limitesDelDia(dias[dias.length - 1]);

  let consulta = supabase
    .from("movimientos")
    .select("tipo, monto, fecha")
    .not("categoria_id", "is", null)
    .is("anulado_at", null)
    .gte("fecha", inicio)
    .lte("fecha", fin);

  if (cajaId) consulta = consulta.eq("caja_id", cajaId);

  const { data } = await consulta;

  const totalesPorDia = new Map(
    dias.map((fecha) => [fecha, { ingresos: 0, egresos: 0 }]),
  );

  for (const movimiento of data ?? []) {
    const fechaMovimiento = formateadorFecha.format(new Date(movimiento.fecha));
    const acumulado = totalesPorDia.get(fechaMovimiento);
    if (!acumulado) continue;

    const clave = movimiento.tipo === "ingreso" ? "ingresos" : "egresos";
    acumulado[clave] += Number(movimiento.monto);
  }

  return dias.map((fecha) => ({
    dia: DIAS_SEMANA[new Date(`${fecha}T00:00:00Z`).getUTCDay()],
    // Mediodía UTC: cae en el mismo día calendario en Lima (UTC-5) sin importar
    // la hora exacta, así el string es seguro para volver a formatear después.
    fecha: `${fecha}T12:00:00Z`,
    ...totalesPorDia.get(fecha)!,
  }));
}

export type SesionDia = {
  id: string;
  aperturaAt: string;
  cierreAt: string | null;
  montoApertura: number;
  montoContado: number | null;
  montoEsperado: number | null;
  diferencia: number | null;
};

// Sesiones que arrancaron dentro de la misma ventana de 6 días que
// obtenerFlujoSemanal/obtenerMovimientosSemana, para poder mapear cada barra
// del gráfico a "su" sesión (abierta = en vivo, cerrada = monto congelado).
export async function obtenerSesionesSemana(cajaId: string): Promise<SesionDia[]> {
  const supabase = await createClient();
  const dias = Array.from({ length: 6 }, (_, i) => fechaLima(i - 5));
  const { inicio } = limitesDelDia(dias[0]);

  const { data } = await supabase
    .from("sesiones_caja")
    .select("id, apertura_at, cierre_at, monto_apertura, monto_contado, monto_esperado, diferencia")
    .eq("caja_id", cajaId)
    .gte("apertura_at", inicio)
    .order("apertura_at", { ascending: true });

  return (data ?? []).map((sesion) => ({
    id: sesion.id,
    aperturaAt: sesion.apertura_at,
    cierreAt: sesion.cierre_at,
    montoApertura: Number(sesion.monto_apertura),
    montoContado: sesion.monto_contado !== null ? Number(sesion.monto_contado) : null,
    montoEsperado: sesion.monto_esperado !== null ? Number(sesion.monto_esperado) : null,
    diferencia: sesion.diferencia !== null ? Number(sesion.diferencia) : null,
  }));
}

export type CajaEmpresa = {
  empresaId: string;
  cajaId: string | null;
  nombre: string;
  color: string | null;
  saldo: number;
  abierta: boolean;
};

export async function obtenerCajasEmpresas(): Promise<CajaEmpresa[]> {
  const supabase = await createClient();

  const [{ data: empresas }, { data: saldos }] = await Promise.all([
    supabase.from("empresas").select("id, nombre, color").eq("activa", true).order("nombre"),
    supabase.from("saldos_cajas").select("caja_id, empresa_id, saldo, abierta").eq("tipo", "empresa"),
  ]);

  const saldoPorEmpresa = new Map((saldos ?? []).map((fila) => [fila.empresa_id, fila]));

  return (empresas ?? []).map((empresa) => {
    const saldo = saldoPorEmpresa.get(empresa.id);
    return {
      empresaId: empresa.id,
      cajaId: saldo?.caja_id ?? null,
      nombre: empresa.nombre,
      color: empresa.color,
      saldo: Number(saldo?.saldo ?? 0),
      abierta: saldo?.abierta ?? false,
    };
  });
}

// El encargado de empresa (rol_global null) queda asignado a exactamente
// una empresa por ahora (decisión explícita del usuario, no multi-empresa).
export async function obtenerEmpresaAsignada(usuarioId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data } = await supabase.from("asignaciones").select("empresa_id").eq("usuario_id", usuarioId).limit(1).maybeSingle();

  return data?.empresa_id ?? null;
}

export type CajaEmpresaDetalle = {
  cajaId: string;
  empresaId: string;
  nombre: string;
  color: string | null;
  saldo: number;
  abierta: boolean;
  sesionAbiertaId: string | null;
};

export async function obtenerCajaEmpresa(empresaId: string): Promise<CajaEmpresaDetalle | null> {
  const supabase = await createClient();

  const [{ data: empresa }, { data: saldo }] = await Promise.all([
    supabase.from("empresas").select("id, nombre, color").eq("id", empresaId).single(),
    supabase.from("saldos_cajas").select("caja_id, saldo, abierta, sesion_abierta_id").eq("empresa_id", empresaId).eq("tipo", "empresa").single(),
  ]);

  if (!empresa || !saldo) return null;

  return {
    cajaId: saldo.caja_id,
    empresaId: empresa.id,
    nombre: empresa.nombre,
    color: empresa.color,
    saldo: Number(saldo.saldo),
    abierta: saldo.abierta,
    sesionAbiertaId: saldo.sesion_abierta_id,
  };
}

export type MovimientoReciente = {
  id: string;
  tipo: "ingreso" | "egreso";
  monto: number;
  descripcion: string | null;
  comprobanteUrl: string | null;
  fecha: string;
  categoriaId: string | null;
  categoriaNombre: string | null;
  categoriaIcono: string | null;
  categoriaColor: string | null;
  transferenciaId: string | null;
};

// Misma ventana de 6 días que obtenerFlujoSemanal, para que el detalle de
// caja pueda tocar una barra del gráfico y filtrar estos movimientos por día
// en el cliente, sin ida y vuelta al servidor por cada día seleccionado.
export async function obtenerMovimientosSemana(cajaId: string): Promise<MovimientoReciente[]> {
  const supabase = await createClient();
  const dias = Array.from({ length: 6 }, (_, i) => fechaLima(i - 5));

  const { inicio } = limitesDelDia(dias[0]);
  const { fin } = limitesDelDia(dias[dias.length - 1]);

  const { data } = await supabase
    .from("movimientos")
    .select("id, tipo, monto, descripcion, comprobante_url, fecha, categoria_id, transferencia_id, categorias(nombre, icono, color)")
    .eq("caja_id", cajaId)
    .is("anulado_at", null)
    .gte("fecha", inicio)
    .lte("fecha", fin)
    .order("fecha", { ascending: false });

  return (data ?? []).map((movimiento) => ({
    id: movimiento.id,
    tipo: movimiento.tipo,
    monto: Number(movimiento.monto),
    descripcion: movimiento.descripcion,
    comprobanteUrl: movimiento.comprobante_url,
    fecha: movimiento.fecha,
    categoriaId: movimiento.categoria_id,
    categoriaNombre: movimiento.categorias?.nombre ?? null,
    transferenciaId: movimiento.transferencia_id,
    categoriaIcono: movimiento.categorias?.icono ?? null,
    categoriaColor: movimiento.categorias?.color ?? null,
  }));
}

// El bucket "comprobantes" es privado — a diferencia del sheet de detalle en
// la PWA (que pide la URL firmada bajo demanda, 60s, justo al tocar "Ver"),
// acá se generan de una para toda una tabla renderizada en el servidor, por
// eso la expiración es más larga (1 hora: alcanza para que el usuario abra
// el enlace mientras tiene la página abierta).
export async function obtenerUrlsComprobantes(rutas: string[]): Promise<Map<string, string>> {
  const rutasUnicas = Array.from(new Set(rutas));
  if (rutasUnicas.length === 0) return new Map();

  const supabase = await createClient();
  const { data } = await supabase.storage.from("comprobantes").createSignedUrls(rutasUnicas, 3600);

  const mapa = new Map<string, string>();
  for (const fila of data ?? []) {
    if (fila.signedUrl && !fila.error) mapa.set(fila.path ?? "", fila.signedUrl);
  }
  return mapa;
}

export type AlertaArqueo = {
  sesionId: string;
  cajaNombre: string;
  cajaColor: string | null;
  cierreAt: string;
  diferencia: number;
};

export async function obtenerAlertasArqueo(dias = 7): Promise<AlertaArqueo[]> {
  const supabase = await createClient();
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("sesiones_caja")
    .select("id, cierre_at, diferencia, cajas(nombre, empresas(color))")
    .not("cierre_at", "is", null)
    .gte("cierre_at", desde)
    .neq("diferencia", 0)
    .order("cierre_at", { ascending: false });

  return (data ?? []).map((sesion) => ({
    sesionId: sesion.id,
    cajaNombre: sesion.cajas?.nombre ?? "Caja",
    cajaColor: sesion.cajas?.empresas?.color ?? null,
    cierreAt: sesion.cierre_at!,
    diferencia: Number(sesion.diferencia),
  }));
}

export type ResultadoBusquedaMovimiento = {
  id: string;
  sesionId: string;
  cajaNombre: string;
  cajaColor: string | null;
  tipo: "ingreso" | "egreso";
  monto: number;
  descripcion: string | null;
  categoriaNombre: string | null;
  categoriaIcono: string | null;
  categoriaColor: string | null;
  fecha: string;
};

// Búsqueda solo por descripción por ahora (ilike va parametrizado por
// supabase-js, seguro); categoría/monto quedan pendientes de otra ronda para
// no filtrar sobre columnas embebidas con texto libre sin resolver bien los casos borde.
export async function buscarMovimientos(texto: string): Promise<ResultadoBusquedaMovimiento[]> {
  const textoLimpio = texto.trim();
  if (!textoLimpio) return [];

  const supabase = await createClient();

  const { data } = await supabase
    .from("movimientos")
    .select("id, sesion_id, tipo, monto, descripcion, fecha, categorias(nombre, icono, color), cajas(nombre, empresas(color))")
    .is("anulado_at", null)
    .ilike("descripcion", `%${textoLimpio}%`)
    .order("fecha", { ascending: false })
    .limit(30);

  return (data ?? []).map((movimiento) => ({
    id: movimiento.id,
    sesionId: movimiento.sesion_id,
    cajaNombre: movimiento.cajas?.nombre ?? "Caja",
    cajaColor: movimiento.cajas?.empresas?.color ?? null,
    tipo: movimiento.tipo,
    monto: Number(movimiento.monto),
    descripcion: movimiento.descripcion,
    categoriaNombre: movimiento.categorias?.nombre ?? null,
    categoriaIcono: movimiento.categorias?.icono ?? null,
    categoriaColor: movimiento.categorias?.color ?? null,
    fecha: movimiento.fecha,
  }));
}

export type CajaFiltro = { id: string; nombre: string; color: string | null };

export async function obtenerCajasFiltro(): Promise<CajaFiltro[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("cajas")
    .select("id, nombre, empresas(color)")
    .eq("tipo", "empresa")
    .eq("activa", true)
    .order("nombre");

  return (data ?? []).map((caja) => ({
    id: caja.id,
    nombre: caja.nombre,
    color: caja.empresas?.color ?? null,
  }));
}

export type SesionHistorial = {
  id: string;
  cajaId: string;
  cajaNombre: string;
  cajaColor: string | null;
  aperturaAt: string;
  cierreAt: string;
  montoApertura: number;
  montoContado: number;
  montoEsperado: number;
  diferencia: number;
  abiertaPor: string | null;
  cerradaPor: string | null;
};

export type RangoFechas = { desde?: string; hasta?: string };

export async function obtenerSesionesCerradas(cajaId?: string, rango?: RangoFechas): Promise<SesionHistorial[]> {
  const supabase = await createClient();

  let consulta = supabase
    .from("sesiones_caja")
    .select(
      "id, caja_id, apertura_at, cierre_at, monto_apertura, monto_contado, monto_esperado, diferencia, cajas(nombre, empresas(color)), abierta_por:perfiles!abierta_por(nombre), cerrada_por:perfiles!cerrada_por(nombre)",
    )
    .not("cierre_at", "is", null)
    .order("cierre_at", { ascending: false });

  if (cajaId) consulta = consulta.eq("caja_id", cajaId);
  if (rango?.desde) consulta = consulta.gte("cierre_at", rango.desde);
  if (rango?.hasta) consulta = consulta.lte("cierre_at", rango.hasta);

  const { data } = await consulta;

  return (data ?? []).map((sesion) => ({
    id: sesion.id,
    cajaId: sesion.caja_id,
    cajaNombre: sesion.cajas?.nombre ?? "Caja",
    cajaColor: sesion.cajas?.empresas?.color ?? null,
    aperturaAt: sesion.apertura_at,
    cierreAt: sesion.cierre_at!,
    montoApertura: Number(sesion.monto_apertura),
    montoContado: Number(sesion.monto_contado),
    montoEsperado: Number(sesion.monto_esperado),
    diferencia: Number(sesion.diferencia),
    abiertaPor: sesion.abierta_por?.nombre ?? null,
    cerradaPor: sesion.cerrada_por?.nombre ?? null,
  }));
}

export type ResumenHistorial = {
  sesionesCerradas: number;
  sesionesDescuadradas: number;
  movimientosAnulados: number;
  diferenciaNeta: number;
};

export async function obtenerResumenHistorial(cajaId?: string, rango?: RangoFechas): Promise<ResumenHistorial> {
  const supabase = await createClient();

  let consultaSesiones = supabase.from("sesiones_caja").select("diferencia").not("cierre_at", "is", null);
  let consultaAnulados = supabase.from("movimientos").select("id", { count: "exact", head: true }).not("anulado_at", "is", null);

  if (cajaId) {
    consultaSesiones = consultaSesiones.eq("caja_id", cajaId);
    consultaAnulados = consultaAnulados.eq("caja_id", cajaId);
  }
  if (rango?.desde) {
    consultaSesiones = consultaSesiones.gte("cierre_at", rango.desde);
    consultaAnulados = consultaAnulados.gte("fecha", rango.desde);
  }
  if (rango?.hasta) {
    consultaSesiones = consultaSesiones.lte("cierre_at", rango.hasta);
    consultaAnulados = consultaAnulados.lte("fecha", rango.hasta);
  }

  const [{ data: sesiones }, { count: movimientosAnulados }] = await Promise.all([consultaSesiones, consultaAnulados]);

  const diferencias = (sesiones ?? []).map((sesion) => Number(sesion.diferencia));

  return {
    sesionesCerradas: diferencias.length,
    sesionesDescuadradas: diferencias.filter((diferencia) => Math.abs(diferencia) >= 0.005).length,
    movimientosAnulados: movimientosAnulados ?? 0,
    diferenciaNeta: diferencias.reduce((total, diferencia) => total + diferencia, 0),
  };
}

export type MovimientoLibroMayor = {
  id: string;
  tipo: "ingreso" | "egreso";
  monto: number;
  fecha: string;
  categoriaNombre: string | null;
  categoriaIcono: string | null;
  categoriaColor: string | null;
  descripcion: string | null;
  anulado: boolean;
  motivoAnulacion: string | null;
  anuladoPor: string | null;
  comprobanteUrl: string | null;
  transferenciaId: string | null;
};

export type SesionDetalle = {
  id: string;
  cajaId: string;
  cajaNombre: string;
  cajaColor: string | null;
  aperturaAt: string;
  cierreAt: string | null;
  montoApertura: number;
  montoContado: number | null;
  montoEsperado: number | null;
  diferencia: number | null;
  observacionesApertura: string | null;
  observacionesCierre: string | null;
  abiertaPor: string | null;
  cerradaPor: string | null;
  movimientos: MovimientoLibroMayor[];
};

export async function obtenerSesionDetalle(sesionId: string): Promise<SesionDetalle | null> {
  const supabase = await createClient();

  const [{ data: sesion }, { data: movimientos }] = await Promise.all([
    supabase
      .from("sesiones_caja")
      .select(
        "id, caja_id, apertura_at, cierre_at, monto_apertura, monto_contado, monto_esperado, diferencia, observaciones_apertura, observaciones_cierre, cajas(nombre, empresas(color)), abierta_por:perfiles!abierta_por(nombre), cerrada_por:perfiles!cerrada_por(nombre)",
      )
      .eq("id", sesionId)
      .single(),
    supabase
      .from("movimientos")
      .select(
        "id, tipo, monto, fecha, descripcion, comprobante_url, anulado_at, motivo_anulacion, transferencia_id, categorias(nombre, icono, color), anulado_por:perfiles!anulado_por(nombre)",
      )
      .eq("sesion_id", sesionId)
      .order("fecha", { ascending: true }),
  ]);

  if (!sesion) return null;

  return {
    id: sesion.id,
    cajaId: sesion.caja_id,
    cajaNombre: sesion.cajas?.nombre ?? "Caja",
    cajaColor: sesion.cajas?.empresas?.color ?? null,
    aperturaAt: sesion.apertura_at,
    cierreAt: sesion.cierre_at,
    montoApertura: Number(sesion.monto_apertura),
    montoContado: sesion.monto_contado !== null ? Number(sesion.monto_contado) : null,
    montoEsperado: sesion.monto_esperado !== null ? Number(sesion.monto_esperado) : null,
    diferencia: sesion.diferencia !== null ? Number(sesion.diferencia) : null,
    observacionesApertura: sesion.observaciones_apertura,
    observacionesCierre: sesion.observaciones_cierre,
    abiertaPor: sesion.abierta_por?.nombre ?? null,
    cerradaPor: sesion.cerrada_por?.nombre ?? null,
    movimientos: (movimientos ?? []).map((movimiento) => ({
      id: movimiento.id,
      tipo: movimiento.tipo,
      monto: Number(movimiento.monto),
      fecha: movimiento.fecha,
      categoriaNombre: movimiento.categorias?.nombre ?? (movimiento.transferencia_id ? "Transferencia" : null),
      categoriaIcono: movimiento.categorias?.icono ?? null,
      categoriaColor: movimiento.categorias?.color ?? null,
      descripcion: movimiento.descripcion,
      anulado: movimiento.anulado_at !== null,
      motivoAnulacion: movimiento.motivo_anulacion,
      anuladoPor: movimiento.anulado_por?.nombre ?? null,
      comprobanteUrl: movimiento.comprobante_url,
      transferenciaId: movimiento.transferencia_id,
    })),
  };
}

export type EmpresaOpcion = { id: string; nombre: string; color: string | null };

export async function obtenerEmpresasActivas(): Promise<EmpresaOpcion[]> {
  const supabase = await createClient();

  const { data } = await supabase.from("empresas").select("id, nombre, color").eq("activa", true).order("nombre");

  return data ?? [];
}

export type UsuarioAdmin = {
  id: string;
  nombre: string;
  email: string;
  rolGlobal: RolGlobal;
  activo: boolean;
  empresasAsignadas: string[];
  empresaIdsAsignadas: string[];
};

export async function obtenerUsuarios(): Promise<UsuarioAdmin[]> {
  const supabase = await createClient();

  const [{ data: perfiles }, { data: asignaciones }] = await Promise.all([
    supabase.from("perfiles").select("id, nombre, email, rol_global, activo").order("nombre"),
    supabase.from("asignaciones").select("usuario_id, empresa_id, empresas(nombre)"),
  ]);

  const empresasPorUsuario = new Map<string, string[]>();
  const empresaIdsPorUsuario = new Map<string, string[]>();

  for (const asignacion of asignaciones ?? []) {
    const lista = empresasPorUsuario.get(asignacion.usuario_id) ?? [];
    if (asignacion.empresas?.nombre) lista.push(asignacion.empresas.nombre);
    empresasPorUsuario.set(asignacion.usuario_id, lista);

    const listaIds = empresaIdsPorUsuario.get(asignacion.usuario_id) ?? [];
    listaIds.push(asignacion.empresa_id);
    empresaIdsPorUsuario.set(asignacion.usuario_id, listaIds);
  }

  return (perfiles ?? []).map((perfil) => ({
    id: perfil.id,
    nombre: perfil.nombre,
    email: perfil.email,
    rolGlobal: perfil.rol_global,
    activo: perfil.activo,
    empresasAsignadas: empresasPorUsuario.get(perfil.id) ?? [],
    empresaIdsAsignadas: empresaIdsPorUsuario.get(perfil.id) ?? [],
  }));
}

export type ResumenOrganizacion = {
  empresasActivas: number;
  usuariosTotales: number;
  standsActivos: number;
};

export async function obtenerResumenOrganizacion(): Promise<ResumenOrganizacion> {
  const supabase = await createClient();

  const [{ count: empresasActivas }, { count: usuariosTotales }, { count: standsActivos }] = await Promise.all([
    supabase.from("empresas").select("id", { count: "exact", head: true }).eq("activa", true),
    supabase.from("perfiles").select("id", { count: "exact", head: true }),
    supabase.from("stands").select("id", { count: "exact", head: true }).eq("activo", true),
  ]);

  return {
    empresasActivas: empresasActivas ?? 0,
    usuariosTotales: usuariosTotales ?? 0,
    standsActivos: standsActivos ?? 0,
  };
}

export type EmpresaResumen = {
  id: string;
  nombre: string;
  color: string | null;
  standsCount: number;
  usuariosCount: number;
};

// Conteos calculados en el cliente (no una vista) porque son dos relaciones
// independientes (stands, asignaciones) sobre la misma empresa: un solo
// count() embebido de Supabase no puede traer ambos a la vez.
export async function obtenerEmpresasConConteo(): Promise<EmpresaResumen[]> {
  const supabase = await createClient();

  const [{ data: empresas }, { data: stands }, { data: asignaciones }] = await Promise.all([
    supabase.from("empresas").select("id, nombre, color").eq("activa", true).order("nombre"),
    supabase.from("stands").select("empresa_id").eq("activo", true),
    supabase.from("asignaciones").select("empresa_id"),
  ]);

  const standsPorEmpresa = new Map<string, number>();
  for (const stand of stands ?? []) {
    standsPorEmpresa.set(stand.empresa_id, (standsPorEmpresa.get(stand.empresa_id) ?? 0) + 1);
  }

  const usuariosPorEmpresa = new Map<string, number>();
  for (const asignacion of asignaciones ?? []) {
    usuariosPorEmpresa.set(asignacion.empresa_id, (usuariosPorEmpresa.get(asignacion.empresa_id) ?? 0) + 1);
  }

  return (empresas ?? []).map((empresa) => ({
    id: empresa.id,
    nombre: empresa.nombre,
    color: empresa.color,
    standsCount: standsPorEmpresa.get(empresa.id) ?? 0,
    usuariosCount: usuariosPorEmpresa.get(empresa.id) ?? 0,
  }));
}

export type CategoriaOpcion = { id: string; nombre: string; icono: string | null; color: string | null };

export async function obtenerCategoriasPorTipo(tipo: "ingreso" | "egreso"): Promise<CategoriaOpcion[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("categorias")
    .select("id, nombre, icono, color")
    .eq("tipo", tipo)
    .eq("activa", true)
    .order("nombre");

  return data ?? [];
}

export type EmpresaAdmin = {
  id: string;
  nombre: string;
  ruc: string | null;
  color: string | null;
  activa: boolean;
  standsCount: number;
  usuariosCount: number;
};

// Igual que obtenerEmpresasConConteo pero sin filtrar por activa (para el
// CRUD de administración, que también necesita ver/reactivar inactivas).
export async function obtenerEmpresasAdmin(): Promise<EmpresaAdmin[]> {
  const supabase = await createClient();

  const [{ data: empresas }, { data: stands }, { data: asignaciones }] = await Promise.all([
    supabase.from("empresas").select("id, nombre, ruc, color, activa").order("nombre"),
    supabase.from("stands").select("empresa_id").eq("activo", true),
    supabase.from("asignaciones").select("empresa_id"),
  ]);

  const standsPorEmpresa = new Map<string, number>();
  for (const stand of stands ?? []) {
    standsPorEmpresa.set(stand.empresa_id, (standsPorEmpresa.get(stand.empresa_id) ?? 0) + 1);
  }

  const usuariosPorEmpresa = new Map<string, number>();
  for (const asignacion of asignaciones ?? []) {
    usuariosPorEmpresa.set(asignacion.empresa_id, (usuariosPorEmpresa.get(asignacion.empresa_id) ?? 0) + 1);
  }

  return (empresas ?? []).map((empresa) => ({
    id: empresa.id,
    nombre: empresa.nombre,
    ruc: empresa.ruc,
    color: empresa.color,
    activa: empresa.activa,
    standsCount: standsPorEmpresa.get(empresa.id) ?? 0,
    usuariosCount: usuariosPorEmpresa.get(empresa.id) ?? 0,
  }));
}

export type StandAdmin = {
  id: string;
  nombre: string;
  activo: boolean;
  empresaId: string;
  empresaNombre: string;
  empresaColor: string | null;
};

export async function obtenerStandsAdmin(): Promise<StandAdmin[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("stands")
    .select("id, nombre, activo, empresa_id, empresas(nombre, color)")
    .order("nombre");

  return (data ?? []).map((stand) => ({
    id: stand.id,
    nombre: stand.nombre,
    activo: stand.activo,
    empresaId: stand.empresa_id,
    empresaNombre: stand.empresas?.nombre ?? "—",
    empresaColor: stand.empresas?.color ?? null,
  }));
}

export type CategoriaAdmin = {
  id: string;
  nombre: string;
  tipo: "ingreso" | "egreso";
  descripcion: string | null;
  icono: string | null;
  color: string | null;
  activa: boolean;
};

export async function obtenerCategoriasAdmin(): Promise<CategoriaAdmin[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("categorias")
    .select("id, nombre, tipo, descripcion, icono, color, activa")
    .order("nombre");

  return data ?? [];
}

export type MovimientoReporte = {
  id: string;
  tipo: "ingreso" | "egreso";
  monto: number;
  fecha: string;
  empresaId: string;
  empresaNombre: string;
  empresaColor: string | null;
  categoriaId: string | null;
  categoriaNombre: string | null;
  categoriaIcono: string | null;
  categoriaColor: string | null;
};

// Consolidado de la organización: solo movimientos de cajas de empresa (no
// stands ni la caja de organización), igual que el resto del panel admin_general.
export async function obtenerMovimientosReporte(rango: RangoFechas, empresaId?: string): Promise<MovimientoReporte[]> {
  const supabase = await createClient();

  let consulta = supabase
    .from("movimientos")
    .select(
      "id, tipo, monto, fecha, categoria_id, categorias(nombre, icono, color), cajas!inner(empresa_id, tipo, empresas(nombre, color))",
    )
    .eq("cajas.tipo", "empresa")
    .not("categoria_id", "is", null)
    .is("anulado_at", null)
    .order("fecha", { ascending: true });

  if (rango.desde) consulta = consulta.gte("fecha", rango.desde);
  if (rango.hasta) consulta = consulta.lte("fecha", rango.hasta);
  if (empresaId) consulta = consulta.eq("cajas.empresa_id", empresaId);

  const { data } = await consulta;

  return (data ?? []).map((movimiento) => ({
    id: movimiento.id,
    tipo: movimiento.tipo,
    monto: Number(movimiento.monto),
    fecha: movimiento.fecha,
    empresaId: movimiento.cajas?.empresa_id ?? "",
    empresaNombre: movimiento.cajas?.empresas?.nombre ?? "—",
    empresaColor: movimiento.cajas?.empresas?.color ?? null,
    categoriaId: movimiento.categoria_id,
    categoriaNombre: movimiento.categorias?.nombre ?? null,
    categoriaIcono: movimiento.categorias?.icono ?? null,
    categoriaColor: movimiento.categorias?.color ?? null,
  }));
}
