"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DownloadIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { fechaLimaISO, formatearFecha, formatearMontoPartes, obtenerIniciales } from "@/lib/formato";
import { colorConAlpha, oscurecerColor } from "@/lib/color";
import { obtenerIcono } from "@/lib/iconos";
import { ThOrdenable } from "@/components/web/admin-general/th-ordenable";
import { FiltroFechasHistorial } from "@/components/web/admin-general/filtro-fechas-historial";
import type { EmpresaOpcion, MovimientoReporte } from "@/lib/consultas";

const PUNTEADO = {
  backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
  backgroundSize: "12px 12px",
};

const BRILLO_METALICO =
  "linear-gradient(125deg, transparent 10%, rgba(255,255,255,0.09) 38%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.09) 62%, transparent 90%)";

type Props = {
  empresas: EmpresaOpcion[];
  movimientos: MovimientoReporte[];
  empresaId?: string;
  desde: string;
  hasta: string;
};

const COLOR_POR_DEFECTO = "#1f7a4d";
const INGRESO = "#1f7a4d";
const EGRESO = "#dc2626";
const CATEGORIA_POR_DEFECTO = "#9ca3af";

type FilaCategoria = { id: string; nombre: string; icono: string | null; color: string; total: number };
type FilaEmpresa = { id: string; nombre: string; color: string; ingresos: number; egresos: number; neto: number; movimientos: number };
type Bucket = { key: string; label: string; ingresos: number; egresos: number; orden: number };

function agruparPorCategoria(movimientos: MovimientoReporte[], tipo: "ingreso" | "egreso"): FilaCategoria[] {
  const mapa = new Map<string, FilaCategoria>();

  for (const movimiento of movimientos) {
    if (movimiento.tipo !== tipo) continue;
    const id = movimiento.categoriaId ?? "sin-categoria";
    const actual = mapa.get(id) ?? {
      id,
      nombre: movimiento.categoriaNombre ?? "Sin categoría",
      icono: movimiento.categoriaIcono,
      color: movimiento.categoriaColor ?? CATEGORIA_POR_DEFECTO,
      total: 0,
    };
    actual.total += movimiento.monto;
    mapa.set(id, actual);
  }

  return Array.from(mapa.values()).sort((a, b) => b.total - a.total);
}

function agruparPorEmpresa(movimientos: MovimientoReporte[]): FilaEmpresa[] {
  const mapa = new Map<string, FilaEmpresa>();

  for (const movimiento of movimientos) {
    const actual = mapa.get(movimiento.empresaId) ?? {
      id: movimiento.empresaId,
      nombre: movimiento.empresaNombre,
      color: movimiento.empresaColor ?? COLOR_POR_DEFECTO,
      ingresos: 0,
      egresos: 0,
      neto: 0,
      movimientos: 0,
    };
    if (movimiento.tipo === "ingreso") actual.ingresos += movimiento.monto;
    else actual.egresos += movimiento.monto;
    actual.neto = actual.ingresos - actual.egresos;
    actual.movimientos += 1;
    mapa.set(movimiento.empresaId, actual);
  }

  return Array.from(mapa.values());
}

const MES_CORTO_ANIO = new Intl.DateTimeFormat("es-PE", { month: "short", year: "2-digit", timeZone: "UTC" });

function agruparPorPeriodo(movimientos: MovimientoReporte[], desde: string, hasta: string): Bucket[] {
  const inicio = new Date(`${desde}T00:00:00Z`);
  const fin = new Date(`${hasta}T00:00:00Z`);
  const diasTotales = Math.max(1, Math.round((fin.getTime() - inicio.getTime()) / 86_400_000) + 1);
  const modo: "dia" | "semana" | "mes" = diasTotales <= 31 ? "dia" : diasTotales <= 120 ? "semana" : "mes";

  function claveDe(diaLima: string) {
    const fecha = new Date(`${diaLima}T12:00:00Z`);

    if (modo === "dia") {
      return { key: diaLima, label: formatearFecha(`${diaLima}T12:00:00Z`), orden: fecha.getTime() };
    }
    if (modo === "semana") {
      const inicioSemana = new Date(fecha);
      inicioSemana.setUTCDate(fecha.getUTCDate() - fecha.getUTCDay());
      const key = inicioSemana.toISOString().slice(0, 10);
      return { key, label: formatearFecha(`${key}T12:00:00Z`), orden: inicioSemana.getTime() };
    }
    const key = diaLima.slice(0, 7);
    return { key, label: MES_CORTO_ANIO.format(fecha), orden: new Date(`${key}-01T00:00:00Z`).getTime() };
  }

  const mapa = new Map<string, Bucket>();
  for (const movimiento of movimientos) {
    const { key, label, orden } = claveDe(fechaLimaISO(movimiento.fecha));
    const actual = mapa.get(key) ?? { key, label, ingresos: 0, egresos: 0, orden };
    if (movimiento.tipo === "ingreso") actual.ingresos += movimiento.monto;
    else actual.egresos += movimiento.monto;
    mapa.set(key, actual);
  }

  return Array.from(mapa.values()).sort((a, b) => a.orden - b.orden);
}

function exportarCSV(movimientos: MovimientoReporte[], desde: string, hasta: string) {
  const encabezado = ["Fecha", "Empresa", "Tipo", "Categoría", "Monto"];
  const filas = movimientos.map((movimiento) => [
    fechaLimaISO(movimiento.fecha),
    movimiento.empresaNombre,
    movimiento.tipo === "ingreso" ? "Ingreso" : "Egreso",
    movimiento.categoriaNombre ?? "Sin categoría",
    movimiento.monto.toFixed(2),
  ]);

  const csv = [encabezado, ...filas]
    .map((fila) => fila.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `reporte_${desde}_${hasta}.csv`;
  enlace.click();
  URL.revokeObjectURL(url);
}

function parteMonto(monto: number) {
  const { entero, decimales } = formatearMontoPartes(monto);
  return `${entero}.${decimales}`;
}

type CampoOrdenEmpresa = "nombre" | "ingresos" | "egresos" | "neto" | "movimientos";

export function ReportesAdminGeneral({ empresas, movimientos, empresaId, desde, hasta }: Props) {
  const [ordenPor, setOrdenPor] = useState<CampoOrdenEmpresa>("neto");
  const [ordenAsc, setOrdenAsc] = useState(false);

  const movimientosIngreso = useMemo(() => movimientos.filter((m) => m.tipo === "ingreso"), [movimientos]);
  const movimientosEgreso = useMemo(() => movimientos.filter((m) => m.tipo === "egreso"), [movimientos]);
  const totalIngresos = useMemo(() => movimientosIngreso.reduce((total, m) => total + m.monto, 0), [movimientosIngreso]);
  const totalEgresos = useMemo(() => movimientosEgreso.reduce((total, m) => total + m.monto, 0), [movimientosEgreso]);
  const neto = totalIngresos - totalEgresos;

  const categoriasIngreso = useMemo(() => agruparPorCategoria(movimientos, "ingreso").slice(0, 6), [movimientos]);
  const categoriasEgreso = useMemo(() => agruparPorCategoria(movimientos, "egreso").slice(0, 6), [movimientos]);
  const maxCategoriaIngreso = Math.max(...categoriasIngreso.map((c) => c.total), 1);
  const maxCategoriaEgreso = Math.max(...categoriasEgreso.map((c) => c.total), 1);

  const buckets = useMemo(() => agruparPorPeriodo(movimientos, desde, hasta), [movimientos, desde, hasta]);
  const maxBucket = Math.max(...buckets.map((b) => Math.max(b.ingresos, b.egresos)), 1);

  const empresasVisibles = useMemo(() => {
    const filas = agruparPorEmpresa(movimientos);
    const signo = ordenAsc ? 1 : -1;
    return filas.sort((a, b) => {
      if (ordenPor === "nombre") return signo * a.nombre.localeCompare(b.nombre);
      return signo * (a[ordenPor] - b[ordenPor]);
    });
  }, [movimientos, ordenPor, ordenAsc]);

  function ordenar(campo: CampoOrdenEmpresa) {
    if (campo === ordenPor) setOrdenAsc((actual) => !actual);
    else {
      setOrdenPor(campo);
      setOrdenAsc(false);
    }
  }

  function hrefFiltro(empresa?: string) {
    const params = new URLSearchParams();
    if (empresa) params.set("empresa", empresa);
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    const query = params.toString();
    return query ? `/panel/reportes?${query}` : "/panel/reportes";
  }

  const montoNeto = formatearMontoPartes(neto);
  const netoPositivo = neto >= 0;
  const colorHero = netoPositivo ? INGRESO : EGRESO;

  return (
    <div>
      <div className="mb-[18px]">
        <h1 className="text-[32px] font-extrabold">Reportes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Consolidado de la organización por categoría y período.</p>
      </div>

      <div className="mb-[18px] grid grid-cols-[2fr_1fr_1fr] gap-[18px] max-[1100px]:grid-cols-1">
        <section
          className="relative overflow-hidden rounded-[26px] p-8 text-white"
          style={{
            background: `radial-gradient(130% 160% at 15% -20%, rgba(255,255,255,0.22), transparent 55%), linear-gradient(135deg, ${colorHero} 0%, ${oscurecerColor(colorHero, 0.75)} 100%)`,
          }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-10" style={PUNTEADO} />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold" style={{ color: netoPositivo ? "#8fd3b0" : "#f5b8b8" }}>
                Neto del período
              </p>
              <button
                type="button"
                onClick={() => exportarCSV(movimientos, desde, hasta)}
                aria-label="Exportar CSV"
                title="Exportar CSV"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-white/30 transition hover:bg-white/10"
              >
                <DownloadIcon className="h-[18px] w-[18px]" />
              </button>
            </div>
            <div className="mt-4 mb-2.5 flex items-baseline gap-1">
              <span className="font-mono text-5xl font-bold tracking-tight">S/ {montoNeto.entero}</span>
              <span className="font-mono text-lg" style={{ color: netoPositivo ? "#8fd3b0" : "#f5b8b8" }}>
                .{montoNeto.decimales}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-white/85">
              <span className="rounded-md bg-white/20 px-1.5 py-px font-bold">{movimientos.length}</span>
              movimientos entre el {formatearFecha(`${desde}T12:00:00Z`)} y el {formatearFecha(`${hasta}T12:00:00Z`)}
            </div>
          </div>
        </section>

        <MetalCard
          label="Ingresos"
          monto={totalIngresos}
          color={INGRESO}
          icon={<TrendingUpIcon className="h-[18px] w-[18px]" />}
          cantidad={movimientosIngreso.length}
          descripcion="movimientos de ingreso"
        />
        <MetalCard
          label="Egresos"
          monto={totalEgresos}
          color={EGRESO}
          icon={<TrendingDownIcon className="h-[18px] w-[18px]" />}
          cantidad={movimientosEgreso.length}
          descripcion="movimientos de egreso"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Link
            href={hrefFiltro(undefined)}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
              !empresaId ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-ring"
            }`}
          >
            Todas
          </Link>
          {empresas.map((empresa) => {
            const activo = empresaId === empresa.id;
            return (
              <Link
                key={empresa.id}
                href={hrefFiltro(empresa.id)}
                className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
                  activo ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-ring"
                }`}
              >
                {empresa.nombre}
              </Link>
            );
          })}
        </div>

        <FiltroFechasHistorial desde={desde} hasta={hasta} />
      </div>

      <div
        className="mb-[18px] rounded-[22px] bg-card p-[22px_22px_12px]"
        style={{ backgroundImage: `linear-gradient(180deg, ${colorConAlpha(INGRESO, 0.05)} 0%, transparent 45%)` }}
      >
        <h3 className="mb-[18px] text-lg font-bold">Ingresos y egresos por período</h3>
        {buckets.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No hay movimientos en este rango.</p>
        ) : (
          <div className="flex h-[200px] items-end gap-4 overflow-x-auto pt-5 pb-1">
            {buckets.map((bucket) => (
              <div key={bucket.key} className="flex h-full min-w-[46px] flex-1 flex-col items-center justify-end gap-2">
                <div className="flex h-full w-full items-end justify-center gap-1">
                  <div
                    className="w-full max-w-[16px] rounded-t-md"
                    style={{ height: `${Math.max(3, Math.round((bucket.ingresos / maxBucket) * 100))}%`, background: INGRESO }}
                    title={`Ingresos: S/ ${parteMonto(bucket.ingresos)}`}
                  />
                  <div
                    className="w-full max-w-[16px] rounded-t-md"
                    style={{ height: `${Math.max(3, Math.round((bucket.egresos / maxBucket) * 100))}%`, background: EGRESO }}
                    title={`Egresos: S/ ${parteMonto(bucket.egresos)}`}
                  />
                </div>
                <span className="text-center text-[11px] font-semibold whitespace-nowrap text-muted-foreground">{bucket.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-[18px] grid grid-cols-2 gap-[18px] max-[1100px]:grid-cols-1">
        <CategoriaCard titulo="Top ingresos por categoría" filas={categoriasIngreso} max={maxCategoriaIngreso} color={INGRESO} />
        <CategoriaCard titulo="Top egresos por categoría" filas={categoriasEgreso} max={maxCategoriaEgreso} color={EGRESO} />
      </div>

      <div className="overflow-hidden rounded-[20px] bg-card shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <ThOrdenable campo="nombre" ordenPor={ordenPor} ordenAsc={ordenAsc} onOrdenar={ordenar}>
                Empresa
              </ThOrdenable>
              <ThOrdenable campo="ingresos" ordenPor={ordenPor} ordenAsc={ordenAsc} onOrdenar={ordenar} alinear="right">
                Ingresos
              </ThOrdenable>
              <ThOrdenable campo="egresos" ordenPor={ordenPor} ordenAsc={ordenAsc} onOrdenar={ordenar} alinear="right">
                Egresos
              </ThOrdenable>
              <ThOrdenable campo="neto" ordenPor={ordenPor} ordenAsc={ordenAsc} onOrdenar={ordenar} alinear="right">
                Neto
              </ThOrdenable>
              <ThOrdenable campo="movimientos" ordenPor={ordenPor} ordenAsc={ordenAsc} onOrdenar={ordenar} alinear="right">
                Movimientos
              </ThOrdenable>
            </tr>
          </thead>
          <tbody>
            {empresasVisibles.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">
                  No hay movimientos en este rango.
                </td>
              </tr>
            )}
            {empresasVisibles.map((empresa) => (
              <tr key={empresa.id} className="transition hover:bg-muted/40">
                <td className="border-b border-border p-3 text-[13px]">
                  <span className="flex items-center gap-3 font-semibold">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${empresa.color}, ${oscurecerColor(empresa.color, 0.55)})` }}
                    >
                      {obtenerIniciales(empresa.nombre)}
                    </span>
                    {empresa.nombre}
                  </span>
                </td>
                <td className="border-b border-border p-3 text-right font-mono text-[13px] font-semibold" style={{ color: INGRESO }}>
                  {parteMonto(empresa.ingresos)}
                </td>
                <td className="border-b border-border p-3 text-right font-mono text-[13px] font-semibold" style={{ color: EGRESO }}>
                  {parteMonto(empresa.egresos)}
                </td>
                <td
                  className="border-b border-border p-3 text-right font-mono text-[13px] font-bold"
                  style={empresa.neto !== 0 ? { color: empresa.neto < 0 ? EGRESO : INGRESO } : undefined}
                >
                  {parteMonto(empresa.neto)}
                </td>
                <td className="border-b border-border p-3 text-right text-[13px] font-semibold text-muted-foreground">{empresa.movimientos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetalCard({
  label,
  monto,
  color,
  icon,
  cantidad,
  descripcion,
}: {
  label: string;
  monto: number;
  color: string;
  icon: React.ReactNode;
  cantidad: number;
  descripcion: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[20px] p-[22px] text-white"
      style={{ background: `linear-gradient(135deg, ${color} 0%, ${oscurecerColor(color, 0.6)} 100%)` }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.14]" style={PUNTEADO} />
      <div className="pointer-events-none absolute inset-0" style={{ background: BRILLO_METALICO }} />
      <div className="relative z-10 flex items-center justify-between text-[15px] font-semibold text-white/85">
        {label}
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-white/25 bg-white/10">{icon}</span>
      </div>
      <div className="relative z-10 mt-4 mb-2.5 font-mono text-[32px] font-extrabold">S/ {parteMonto(monto)}</div>
      <div className="relative z-10 flex items-center gap-1.5 text-[12.5px] text-white/80">
        <span className="rounded-md bg-white/20 px-1.5 py-px font-bold">{cantidad}</span>
        {descripcion}
      </div>
    </div>
  );
}

function CategoriaCard({ titulo, filas, max, color }: { titulo: string; filas: FilaCategoria[]; max: number; color: string }) {
  return (
    <div className="relative overflow-hidden rounded-[22px] bg-card p-[22px]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(120% 140% at 100% -20%, ${colorConAlpha(color, 0.14)}, transparent 60%)` }}
      />
      <h3 className="relative z-10 mb-[18px] text-lg font-bold">{titulo}</h3>
      {filas.length === 0 ? (
        <p className="relative z-10 py-4 text-center text-sm text-muted-foreground">Sin movimientos en este rango.</p>
      ) : (
        <div className="relative z-10 flex flex-col gap-3.5">
          {filas.map((fila) => {
            const Icono = obtenerIcono(fila.icono);
            const pct = Math.max(4, Math.round((fila.total / max) * 100));

            return (
              <div key={fila.id} className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: colorConAlpha(fila.color, 0.12), color: fila.color }}
                >
                  <Icono className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 text-[13px] font-semibold">
                    <span className="truncate">{fila.nombre}</span>
                    <span className="shrink-0 font-mono" style={{ color }}>
                      S/ {parteMonto(fila.total)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: fila.color }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
