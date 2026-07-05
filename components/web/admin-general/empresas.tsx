"use client";

import { useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";
import { EncabezadoAdmin } from "@/components/web/admin-general/encabezado-admin";
import { FilaTabla } from "@/components/web/admin-general/fila-tabla";
import { ThOrdenable } from "@/components/web/admin-general/th-ordenable";
import { AvatarInicial } from "@/components/web/admin-general/avatar-inicial";
import { BadgeEstado } from "@/components/web/admin-general/badge-estado";
import { SheetFormEmpresa } from "@/components/web/admin-general/sheet-form-empresa";
import type { EmpresaAdmin } from "@/lib/consultas";

type Props = {
  empresas: EmpresaAdmin[];
};

type CampoOrden = "nombre" | "standsCount" | "usuariosCount";
type FiltroEstado = "todas" | "activas" | "inactivas";

const FILTROS: { valor: FiltroEstado; label: string }[] = [
  { valor: "todas", label: "Todas" },
  { valor: "activas", label: "Activas" },
  { valor: "inactivas", label: "Inactivas" },
];

export function EmpresasAdminGeneral({ empresas }: Props) {
  const [buscar, setBuscar] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todas");
  const [ordenPor, setOrdenPor] = useState<CampoOrden>("nombre");
  const [ordenAsc, setOrdenAsc] = useState(true);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<EmpresaAdmin | null>(null);

  function ordenar(campo: CampoOrden) {
    if (campo === ordenPor) setOrdenAsc((actual) => !actual);
    else {
      setOrdenPor(campo);
      setOrdenAsc(true);
    }
  }

  function abrirCrear() {
    setEmpresaSeleccionada(null);
    setDialogAbierto(true);
  }

  function abrirEditar(empresa: EmpresaAdmin) {
    setEmpresaSeleccionada(empresa);
    setDialogAbierto(true);
  }

  const empresasVisibles = useMemo(() => {
    const termino = buscar.trim().toLowerCase();

    const filtradas = empresas.filter((empresa) => {
      if (filtroEstado === "activas" && !empresa.activa) return false;
      if (filtroEstado === "inactivas" && empresa.activa) return false;
      if (!termino) return true;
      return empresa.nombre.toLowerCase().includes(termino) || (empresa.ruc ?? "").toLowerCase().includes(termino);
    });

    const signo = ordenAsc ? 1 : -1;
    return [...filtradas].sort((a, b) => {
      if (ordenPor === "nombre") return signo * a.nombre.localeCompare(b.nombre);
      return signo * (a[ordenPor] - b[ordenPor]);
    });
  }, [empresas, buscar, filtroEstado, ordenPor, ordenAsc]);

  return (
    <div>
      <EncabezadoAdmin
        titulo="Empresas"
        contador={`${empresasVisibles.length} de ${empresas.length} empresas`}
        buscar={buscar}
        onBuscarChange={setBuscar}
        placeholderBuscar="Buscar empresa o RUC..."
      >
        <button
          type="button"
          onClick={abrirCrear}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
        >
          <PlusIcon className="h-4 w-4" /> Nueva empresa
        </button>
      </EncabezadoAdmin>

      <div className="mb-4 flex flex-wrap gap-2">
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

      <div className="overflow-hidden rounded-[20px] bg-card shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <ThOrdenable campo="nombre" ordenPor={ordenPor} ordenAsc={ordenAsc} onOrdenar={ordenar}>
                Empresa
              </ThOrdenable>
              <th className="border-b border-border p-3 text-left text-[13px] font-medium text-muted-foreground">RUC</th>
              <ThOrdenable campo="standsCount" ordenPor={ordenPor} ordenAsc={ordenAsc} onOrdenar={ordenar} alinear="right">
                Stands
              </ThOrdenable>
              <ThOrdenable campo="usuariosCount" ordenPor={ordenPor} ordenAsc={ordenAsc} onOrdenar={ordenar} alinear="right">
                Usuarios
              </ThOrdenable>
              <th className="border-b border-border p-3 text-right text-[13px] font-medium text-muted-foreground">Estado</th>
            </tr>
          </thead>
          <tbody>
            {empresasVisibles.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">
                  No hay empresas que coincidan con la búsqueda.
                </td>
              </tr>
            )}
            {empresasVisibles.map((empresa) => (
              <FilaTabla key={empresa.id} onClick={() => abrirEditar(empresa)}>
                <td className="border-b border-border p-3 text-[13px]">
                  <span className="flex items-center gap-3 font-semibold">
                    <AvatarInicial nombre={empresa.nombre} color={empresa.color} size={32} />
                    {empresa.nombre}
                  </span>
                </td>
                <td className="border-b border-border p-3 text-[13px] text-muted-foreground">{empresa.ruc || "—"}</td>
                <td className="border-b border-border p-3 text-right text-[13px] font-semibold">{empresa.standsCount}</td>
                <td className="border-b border-border p-3 text-right text-[13px] font-semibold">{empresa.usuariosCount}</td>
                <td className="border-b border-border p-3 text-right">
                  <BadgeEstado activo={empresa.activa} />
                </td>
              </FilaTabla>
            ))}
          </tbody>
        </table>
      </div>

      <SheetFormEmpresa empresa={empresaSeleccionada} abierto={dialogAbierto} onOpenChange={setDialogAbierto} />
    </div>
  );
}
