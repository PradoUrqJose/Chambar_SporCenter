"use client";

import { useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";
import { EncabezadoAdmin } from "@/components/web/tabla/encabezado-admin";
import { FilaTabla } from "@/components/web/tabla/fila-tabla";
import { ThOrdenable } from "@/components/web/tabla/th-ordenable";
import { AvatarInicial } from "@/components/web/tabla/avatar-inicial";
import { BadgeEstado } from "@/components/web/tabla/badge-estado";
import { SheetFormUsuario } from "@/components/web/usuarios/sheet-form-usuario";
import { etiquetaRol, type RolGlobal } from "@/lib/roles";
import type { EmpresaOpcion, UsuarioAdmin } from "@/lib/consultas";

type Props = {
  usuarios: UsuarioAdmin[];
  empresas: EmpresaOpcion[];
};

type CampoOrden = "nombre" | "email";
type FiltroRol = "todos" | "admin_general" | "admin_organizacion" | "encargado";
type FiltroEstado = "todos" | "activos" | "inactivos";

const FILTROS_ROL: { valor: FiltroRol; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "admin_general", label: etiquetaRol("admin_general") },
  { valor: "admin_organizacion", label: etiquetaRol("admin_organizacion") },
  { valor: "encargado", label: etiquetaRol(null) },
];

const FILTROS_ESTADO: { valor: FiltroEstado; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "activos", label: "Activos" },
  { valor: "inactivos", label: "Inactivos" },
];

function coincideFiltroRol(rol: RolGlobal, filtro: FiltroRol) {
  if (filtro === "todos") return true;
  if (filtro === "encargado") return rol === null;
  return rol === filtro;
}

export function UsuariosAdminGeneral({ usuarios, empresas }: Props) {
  const [buscar, setBuscar] = useState("");
  const [filtroRol, setFiltroRol] = useState<FiltroRol>("todos");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [ordenPor, setOrdenPor] = useState<CampoOrden>("nombre");
  const [ordenAsc, setOrdenAsc] = useState(true);
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioAdmin | null>(null);

  function ordenar(campo: CampoOrden) {
    if (campo === ordenPor) setOrdenAsc((actual) => !actual);
    else {
      setOrdenPor(campo);
      setOrdenAsc(true);
    }
  }

  function abrirInvitar() {
    setUsuarioSeleccionado(null);
    setDialogAbierto(true);
  }

  function abrirEditar(usuario: UsuarioAdmin) {
    setUsuarioSeleccionado(usuario);
    setDialogAbierto(true);
  }

  const usuariosVisibles = useMemo(() => {
    const termino = buscar.trim().toLowerCase();

    const filtrados = usuarios.filter((usuario) => {
      if (!coincideFiltroRol(usuario.rolGlobal, filtroRol)) return false;
      if (filtroEstado === "activos" && !usuario.activo) return false;
      if (filtroEstado === "inactivos" && usuario.activo) return false;
      if (!termino) return true;
      return usuario.nombre.toLowerCase().includes(termino) || usuario.email.toLowerCase().includes(termino);
    });

    const signo = ordenAsc ? 1 : -1;
    return [...filtrados].sort((a, b) => signo * a[ordenPor].localeCompare(b[ordenPor]));
  }, [usuarios, buscar, filtroRol, filtroEstado, ordenPor, ordenAsc]);

  return (
    <div>
      <EncabezadoAdmin
        titulo="Usuarios"
        contador={`${usuariosVisibles.length} de ${usuarios.length} usuarios`}
        buscar={buscar}
        onBuscarChange={setBuscar}
        placeholderBuscar="Buscar usuario o email..."
      >
        <button
          type="button"
          onClick={abrirInvitar}
          className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
        >
          <PlusIcon className="h-4 w-4" /> Invitar usuario
        </button>
      </EncabezadoAdmin>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTROS_ROL.map((filtro) => {
            const activo = filtroRol === filtro.valor;
            return (
              <button
                key={filtro.valor}
                type="button"
                onClick={() => setFiltroRol(filtro.valor)}
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
                Usuario
              </ThOrdenable>
              <th className="border-b border-border p-3 text-left text-[13px] font-medium text-muted-foreground">Rol</th>
              <th className="border-b border-border p-3 text-left text-[13px] font-medium text-muted-foreground">Empresas</th>
              <th className="border-b border-border p-3 text-right text-[13px] font-medium text-muted-foreground">Estado</th>
            </tr>
          </thead>
          <tbody>
            {usuariosVisibles.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-sm text-muted-foreground">
                  No hay usuarios que coincidan con la búsqueda.
                </td>
              </tr>
            )}
            {usuariosVisibles.map((usuario) => (
              <FilaTabla key={usuario.id} onClick={() => abrirEditar(usuario)}>
                <td className="border-b border-border p-3 text-[13px]">
                  <span className="flex items-center gap-3">
                    <AvatarInicial nombre={usuario.nombre} size={32} />
                    <span>
                      <span className="block font-semibold">{usuario.nombre}</span>
                      <span className="block text-[12px] text-muted-foreground">{usuario.email}</span>
                    </span>
                  </span>
                </td>
                <td className="border-b border-border p-3 text-[13px] text-muted-foreground">{etiquetaRol(usuario.rolGlobal)}</td>
                <td className="border-b border-border p-3 text-[13px] text-muted-foreground">
                  {usuario.rolGlobal === null ? usuario.empresasAsignadas.join(", ") || "—" : "Todas"}
                </td>
                <td className="border-b border-border p-3 text-right">
                  <BadgeEstado activo={usuario.activo} />
                </td>
              </FilaTabla>
            ))}
          </tbody>
        </table>
      </div>

      <SheetFormUsuario usuario={usuarioSeleccionado} empresas={empresas} abierto={dialogAbierto} onOpenChange={setDialogAbierto} />
    </div>
  );
}
