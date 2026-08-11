"use client";

import { useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";
import { EncabezadoAdmin } from "@/components/web/tabla/encabezado-admin";
import { FilaTabla } from "@/components/web/tabla/fila-tabla";
import { ThOrdenable } from "@/components/web/tabla/th-ordenable";
import { BadgeEstado } from "@/components/web/tabla/badge-estado";
import { SheetFormMedioPago } from "@/components/web/medios-pago/sheet-form-medio-pago";
import { obtenerIcono } from "@/lib/iconos";
import { colorConAlpha } from "@/lib/color";
import type { MedioPagoAdmin } from "@/lib/consultas";

type Props = {
  mediosPago: MedioPagoAdmin[];
};

type CampoOrden = "nombre" | "tipo";
type FiltroTipo = "todos" | "tarjeta" | "transferencia";
type FiltroEstado = "todos" | "activos" | "inactivos";

const FILTROS_TIPO: { valor: FiltroTipo; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "tarjeta", label: "Tarjeta" },
  { valor: "transferencia", label: "Transferencia" },
];

const FILTROS_ESTADO: { valor: FiltroEstado; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "activos", label: "Activos" },
  { valor: "inactivos", label: "Inactivos" },
];

const MEDIO_POR_DEFECTO = "#9ca3af";
const TARJETA = "#7c3aed";
const TRANSFERENCIA = "#0891b2";

export function MediosPagoAdminGeneral({ mediosPago }: Props) {
  const [buscar, setBuscar] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [ordenPor, setOrdenPor] = useState<CampoOrden>("nombre");
  const [ordenAsc, setOrdenAsc] = useState(true);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [medioSeleccionado, setMedioSeleccionado] = useState<MedioPagoAdmin | null>(null);

  function ordenar(campo: CampoOrden) {
    if (campo === ordenPor) setOrdenAsc((actual) => !actual);
    else {
      setOrdenPor(campo);
      setOrdenAsc(true);
    }
  }

  function abrirCrear() {
    setMedioSeleccionado(null);
    setDialogAbierto(true);
  }

  function abrirEditar(medio: MedioPagoAdmin) {
    setMedioSeleccionado(medio);
    setDialogAbierto(true);
  }

  const mediosVisibles = useMemo(() => {
    const termino = buscar.trim().toLowerCase();

    const filtrados = mediosPago.filter((medio) => {
      if (filtroTipo !== "todos" && medio.tipo !== filtroTipo) return false;
      if (filtroEstado === "activos" && !medio.activo) return false;
      if (filtroEstado === "inactivos" && medio.activo) return false;
      if (!termino) return true;
      return medio.nombre.toLowerCase().includes(termino) || (medio.descripcion ?? "").toLowerCase().includes(termino);
    });

    const signo = ordenAsc ? 1 : -1;
    return [...filtrados].sort((a, b) => signo * a[ordenPor].localeCompare(b[ordenPor]));
  }, [mediosPago, buscar, filtroTipo, filtroEstado, ordenPor, ordenAsc]);

  return (
    <div>
      <EncabezadoAdmin
        titulo="Medios de pago"
        contador={`${mediosVisibles.length} de ${mediosPago.length} medios de pago`}
        buscar={buscar}
        onBuscarChange={setBuscar}
        placeholderBuscar="Buscar medio de pago..."
      >
        <button
          type="button"
          onClick={abrirCrear}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
        >
          <PlusIcon className="h-4 w-4" /> Nuevo medio de pago
        </button>
      </EncabezadoAdmin>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTROS_TIPO.map((filtro) => {
            const activo = filtroTipo === filtro.valor;
            return (
              <button
                key={filtro.valor}
                type="button"
                onClick={() => setFiltroTipo(filtro.valor)}
                className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
                  activo ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-ring"
                }`}
              >
                {filtro.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTROS_ESTADO.map((filtro) => {
            const activo = filtroEstado === filtro.valor;
            return (
              <button
                key={filtro.valor}
                type="button"
                onClick={() => setFiltroEstado(filtro.valor)}
                className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
                  activo ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-ring"
                }`}
              >
                {filtro.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-[20px] bg-card shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <ThOrdenable campo="nombre" ordenPor={ordenPor} ordenAsc={ordenAsc} onOrdenar={ordenar}>
                Medio de pago
              </ThOrdenable>
              <ThOrdenable campo="tipo" ordenPor={ordenPor} ordenAsc={ordenAsc} onOrdenar={ordenar}>
                Tipo
              </ThOrdenable>
              <th className="border-b border-border p-3 text-left text-[13px] font-medium text-muted-foreground">Descripción</th>
              <th className="border-b border-border p-3 text-right text-[13px] font-medium text-muted-foreground">Estado</th>
            </tr>
          </thead>
          <tbody>
            {mediosVisibles.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-sm text-muted-foreground">
                  No hay medios de pago que coincidan con la búsqueda.
                </td>
              </tr>
            )}
            {mediosVisibles.map((medio) => {
              const color = medio.color ?? MEDIO_POR_DEFECTO;
              const Icono = obtenerIcono(medio.icono);

              return (
                <FilaTabla key={medio.id} onClick={() => abrirEditar(medio)}>
                  <td className="border-b border-border p-3 text-[13px]">
                    <span className="flex items-center gap-3 font-semibold">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: colorConAlpha(color, 0.12), color }}
                      >
                        <Icono className="h-4 w-4" />
                      </span>
                      {medio.nombre}
                    </span>
                  </td>
                  <td className="border-b border-border p-3 text-[13px]">
                    <span
                      className="inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase"
                      style={{
                        backgroundColor: `${medio.tipo === "tarjeta" ? TARJETA : TRANSFERENCIA}1a`,
                        color: medio.tipo === "tarjeta" ? TARJETA : TRANSFERENCIA,
                      }}
                    >
                      {medio.tipo}
                    </span>
                  </td>
                  <td className="border-b border-border p-3 text-[13px] text-muted-foreground">{medio.descripcion || "—"}</td>
                  <td className="border-b border-border p-3 text-right">
                    <BadgeEstado activo={medio.activo} />
                  </td>
                </FilaTabla>
              );
            })}
          </tbody>
        </table>
      </div>

      <SheetFormMedioPago medioPago={medioSeleccionado} abierto={dialogAbierto} onOpenChange={setDialogAbierto} />
    </div>
  );
}
