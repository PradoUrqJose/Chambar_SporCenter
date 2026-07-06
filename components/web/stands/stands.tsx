"use client";

import { useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";
import { EncabezadoAdmin } from "@/components/web/tabla/encabezado-admin";
import { FilaTabla } from "@/components/web/tabla/fila-tabla";
import { ThOrdenable } from "@/components/web/tabla/th-ordenable";
import { AvatarInicial } from "@/components/web/tabla/avatar-inicial";
import { BadgeEstado } from "@/components/web/tabla/badge-estado";
import { SheetFormStand } from "@/components/web/stands/sheet-form-stand";
import type { EmpresaOpcion, StandAdmin } from "@/lib/consultas";

type Props = {
  stands: StandAdmin[];
  empresas: EmpresaOpcion[];
};

type CampoOrden = "nombre" | "empresaNombre";
type FiltroEstado = "todos" | "activos" | "inactivos";

const FILTROS: { valor: FiltroEstado; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "activos", label: "Activos" },
  { valor: "inactivos", label: "Inactivos" },
];

export function StandsAdminGeneral({ stands, empresas }: Props) {
  const [buscar, setBuscar] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [filtroEmpresa, setFiltroEmpresa] = useState<string | null>(null);
  const [ordenPor, setOrdenPor] = useState<CampoOrden>("nombre");
  const [ordenAsc, setOrdenAsc] = useState(true);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [standSeleccionado, setStandSeleccionado] = useState<StandAdmin | null>(null);

  function ordenar(campo: CampoOrden) {
    if (campo === ordenPor) setOrdenAsc((actual) => !actual);
    else {
      setOrdenPor(campo);
      setOrdenAsc(true);
    }
  }

  function abrirCrear() {
    setStandSeleccionado(null);
    setDialogAbierto(true);
  }

  function abrirEditar(stand: StandAdmin) {
    setStandSeleccionado(stand);
    setDialogAbierto(true);
  }

  const standsVisibles = useMemo(() => {
    const termino = buscar.trim().toLowerCase();

    const filtrados = stands.filter((stand) => {
      if (filtroEstado === "activos" && !stand.activo) return false;
      if (filtroEstado === "inactivos" && stand.activo) return false;
      if (filtroEmpresa && stand.empresaId !== filtroEmpresa) return false;
      if (!termino) return true;
      return stand.nombre.toLowerCase().includes(termino) || stand.empresaNombre.toLowerCase().includes(termino);
    });

    const signo = ordenAsc ? 1 : -1;
    return [...filtrados].sort((a, b) => signo * a[ordenPor].localeCompare(b[ordenPor]));
  }, [stands, buscar, filtroEstado, filtroEmpresa, ordenPor, ordenAsc]);

  return (
    <div>
      <EncabezadoAdmin
        titulo="Stands"
        contador={`${standsVisibles.length} de ${stands.length} stands`}
        buscar={buscar}
        onBuscarChange={setBuscar}
        placeholderBuscar="Buscar stand o empresa..."
      >
        <button
          type="button"
          onClick={abrirCrear}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
        >
          <PlusIcon className="h-4 w-4" /> Nuevo stand
        </button>
      </EncabezadoAdmin>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((filtro) => {
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

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFiltroEmpresa(null)}
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
              !filtroEmpresa ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-ring"
            }`}
          >
            Todas las empresas
          </button>
          {empresas.map((empresa) => {
            const activo = filtroEmpresa === empresa.id;
            return (
              <button
                key={empresa.id}
                type="button"
                onClick={() => setFiltroEmpresa(empresa.id)}
                className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
                  activo ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-ring"
                }`}
              >
                {empresa.nombre}
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
                Stand
              </ThOrdenable>
              <ThOrdenable campo="empresaNombre" ordenPor={ordenPor} ordenAsc={ordenAsc} onOrdenar={ordenar}>
                Empresa
              </ThOrdenable>
              <th className="border-b border-border p-3 text-right text-[13px] font-medium text-muted-foreground">Estado</th>
            </tr>
          </thead>
          <tbody>
            {standsVisibles.length === 0 && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-sm text-muted-foreground">
                  No hay stands que coincidan con la búsqueda.
                </td>
              </tr>
            )}
            {standsVisibles.map((stand) => (
              <FilaTabla key={stand.id} onClick={() => abrirEditar(stand)}>
                <td className="border-b border-border p-3 text-[13px] font-semibold">{stand.nombre}</td>
                <td className="border-b border-border p-3 text-[13px] text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <AvatarInicial nombre={stand.empresaNombre} color={stand.empresaColor} size={26} />
                    {stand.empresaNombre}
                  </span>
                </td>
                <td className="border-b border-border p-3 text-right">
                  <BadgeEstado activo={stand.activo} />
                </td>
              </FilaTabla>
            ))}
          </tbody>
        </table>
      </div>

      <SheetFormStand stand={standSeleccionado} empresas={empresas} abierto={dialogAbierto} onOpenChange={setDialogAbierto} />
    </div>
  );
}
