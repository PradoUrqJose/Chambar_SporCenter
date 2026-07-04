import { createClient } from "@/lib/supabase/server";

const ZONA_HORARIA = "America/Lima";
const OFFSET_LIMA = "-05:00";
const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const formateadorFecha = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_HORARIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function fechaLima(offsetDias = 0): string {
  const fecha = new Date(Date.now() + offsetDias * 24 * 60 * 60 * 1000);
  return formateadorFecha.format(fecha);
}

function limitesDelDia(fechaISO: string) {
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

export type FlujoDia = { dia: string; ingresos: number; egresos: number };

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
    ...totalesPorDia.get(fecha)!,
  }));
}

export type CajaEmpresa = {
  empresaId: string;
  nombre: string;
  color: string | null;
  saldo: number;
  abierta: boolean;
};

export async function obtenerCajasEmpresas(): Promise<CajaEmpresa[]> {
  const supabase = await createClient();

  const [{ data: empresas }, { data: saldos }] = await Promise.all([
    supabase.from("empresas").select("id, nombre, color").eq("activa", true).order("nombre"),
    supabase.from("saldos_cajas").select("empresa_id, saldo, abierta").eq("tipo", "empresa"),
  ]);

  const saldoPorEmpresa = new Map((saldos ?? []).map((fila) => [fila.empresa_id, fila]));

  return (empresas ?? []).map((empresa) => {
    const saldo = saldoPorEmpresa.get(empresa.id);
    return {
      empresaId: empresa.id,
      nombre: empresa.nombre,
      color: empresa.color,
      saldo: Number(saldo?.saldo ?? 0),
      abierta: saldo?.abierta ?? false,
    };
  });
}

export type CajaEmpresaDetalle = {
  cajaId: string;
  empresaId: string;
  nombre: string;
  color: string | null;
  saldo: number;
  abierta: boolean;
};

export async function obtenerCajaEmpresa(empresaId: string): Promise<CajaEmpresaDetalle | null> {
  const supabase = await createClient();

  const [{ data: empresa }, { data: saldo }] = await Promise.all([
    supabase.from("empresas").select("id, nombre, color").eq("id", empresaId).single(),
    supabase.from("saldos_cajas").select("caja_id, saldo, abierta").eq("empresa_id", empresaId).eq("tipo", "empresa").single(),
  ]);

  if (!empresa || !saldo) return null;

  return {
    cajaId: saldo.caja_id,
    empresaId: empresa.id,
    nombre: empresa.nombre,
    color: empresa.color,
    saldo: Number(saldo.saldo),
    abierta: saldo.abierta,
  };
}

export type MovimientoReciente = {
  id: string;
  tipo: "ingreso" | "egreso";
  monto: number;
  descripcion: string | null;
  fecha: string;
  categoriaNombre: string | null;
  categoriaIcono: string | null;
  categoriaColor: string | null;
};

export async function obtenerMovimientosRecientes(cajaId: string, limite = 8): Promise<MovimientoReciente[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("movimientos")
    .select("id, tipo, monto, descripcion, fecha, categorias(nombre, icono, color)")
    .eq("caja_id", cajaId)
    .is("anulado_at", null)
    .order("fecha", { ascending: false })
    .limit(limite);

  return (data ?? []).map((movimiento) => ({
    id: movimiento.id,
    tipo: movimiento.tipo,
    monto: Number(movimiento.monto),
    descripcion: movimiento.descripcion,
    fecha: movimiento.fecha,
    categoriaNombre: movimiento.categorias?.nombre ?? null,
    categoriaIcono: movimiento.categorias?.icono ?? null,
    categoriaColor: movimiento.categorias?.color ?? null,
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
