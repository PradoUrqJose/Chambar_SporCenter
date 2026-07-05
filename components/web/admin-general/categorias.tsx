"use client";

import { useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";
import { EncabezadoAdmin } from "@/components/web/admin-general/encabezado-admin";
import { FilaTabla } from "@/components/web/admin-general/fila-tabla";
import { ThOrdenable } from "@/components/web/admin-general/th-ordenable";
import { BadgeEstado } from "@/components/web/admin-general/badge-estado";
import { SheetFormCategoria } from "@/components/web/admin-general/sheet-form-categoria";
import { obtenerIcono } from "@/lib/iconos";
import { colorConAlpha } from "@/lib/color";
import type { CategoriaAdmin } from "@/lib/consultas";

type Props = {
  categorias: CategoriaAdmin[];
};

type CampoOrden = "nombre" | "tipo";
type FiltroTipo = "todas" | "ingreso" | "egreso";
type FiltroEstado = "todas" | "activas" | "inactivas";

const FILTROS_TIPO: { valor: FiltroTipo; label: string }[] = [
  { valor: "todas", label: "Todas" },
  { valor: "ingreso", label: "Ingreso" },
  { valor: "egreso", label: "Egreso" },
];

const FILTROS_ESTADO: { valor: FiltroEstado; label: string }[] = [
  { valor: "todas", label: "Todas" },
  { valor: "activas", label: "Activas" },
  { valor: "inactivas", label: "Inactivas" },
];

const CATEGORIA_POR_DEFECTO = "#9ca3af";
const INGRESO = "#1f7a4d";
const EGRESO = "#dc2626";

export function CategoriasAdminGeneral({ categorias }: Props) {
  const [buscar, setBuscar] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todas");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todas");
  const [ordenPor, setOrdenPor] = useState<CampoOrden>("nombre");
  const [ordenAsc, setOrdenAsc] = useState(true);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaAdmin | null>(null);

  function ordenar(campo: CampoOrden) {
    if (campo === ordenPor) setOrdenAsc((actual) => !actual);
    else {
      setOrdenPor(campo);
      setOrdenAsc(true);
    }
  }

  function abrirCrear() {
    setCategoriaSeleccionada(null);
    setDialogAbierto(true);
  }

  function abrirEditar(categoria: CategoriaAdmin) {
    setCategoriaSeleccionada(categoria);
    setDialogAbierto(true);
  }

  const categoriasVisibles = useMemo(() => {
    const termino = buscar.trim().toLowerCase();

    const filtradas = categorias.filter((categoria) => {
      if (filtroTipo !== "todas" && categoria.tipo !== filtroTipo) return false;
      if (filtroEstado === "activas" && !categoria.activa) return false;
      if (filtroEstado === "inactivas" && categoria.activa) return false;
      if (!termino) return true;
      return categoria.nombre.toLowerCase().includes(termino) || (categoria.descripcion ?? "").toLowerCase().includes(termino);
    });

    const signo = ordenAsc ? 1 : -1;
    return [...filtradas].sort((a, b) => signo * a[ordenPor].localeCompare(b[ordenPor]));
  }, [categorias, buscar, filtroTipo, filtroEstado, ordenPor, ordenAsc]);

  return (
    <div>
      <EncabezadoAdmin
        titulo="Categorías"
        contador={`${categoriasVisibles.length} de ${categorias.length} categorías`}
        buscar={buscar}
        onBuscarChange={setBuscar}
        placeholderBuscar="Buscar categoría..."
      >
        <button
          type="button"
          onClick={abrirCrear}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
        >
          <PlusIcon className="h-4 w-4" /> Nueva categoría
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
                Categoría
              </ThOrdenable>
              <ThOrdenable campo="tipo" ordenPor={ordenPor} ordenAsc={ordenAsc} onOrdenar={ordenar}>
                Tipo
              </ThOrdenable>
              <th className="border-b border-border p-3 text-left text-[13px] font-medium text-muted-foreground">Descripción</th>
              <th className="border-b border-border p-3 text-right text-[13px] font-medium text-muted-foreground">Estado</th>
            </tr>
          </thead>
          <tbody>
            {categoriasVisibles.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-sm text-muted-foreground">
                  No hay categorías que coincidan con la búsqueda.
                </td>
              </tr>
            )}
            {categoriasVisibles.map((categoria) => {
              const color = categoria.color ?? CATEGORIA_POR_DEFECTO;
              const Icono = obtenerIcono(categoria.icono);

              return (
                <FilaTabla key={categoria.id} onClick={() => abrirEditar(categoria)}>
                  <td className="border-b border-border p-3 text-[13px]">
                    <span className="flex items-center gap-3 font-semibold">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: colorConAlpha(color, 0.12), color }}
                      >
                        <Icono className="h-4 w-4" />
                      </span>
                      {categoria.nombre}
                    </span>
                  </td>
                  <td className="border-b border-border p-3 text-[13px]">
                    <span
                      className="inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase"
                      style={{ backgroundColor: `${categoria.tipo === "ingreso" ? INGRESO : EGRESO}1a`, color: categoria.tipo === "ingreso" ? INGRESO : EGRESO }}
                    >
                      {categoria.tipo}
                    </span>
                  </td>
                  <td className="border-b border-border p-3 text-[13px] text-muted-foreground">{categoria.descripcion || "—"}</td>
                  <td className="border-b border-border p-3 text-right">
                    <BadgeEstado activo={categoria.activa} />
                  </td>
                </FilaTabla>
              );
            })}
          </tbody>
        </table>
      </div>

      <SheetFormCategoria categoria={categoriaSeleccionada} abierto={dialogAbierto} onOpenChange={setDialogAbierto} />
    </div>
  );
}
