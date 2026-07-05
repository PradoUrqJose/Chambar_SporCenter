import { obtenerIniciales } from "@/lib/formato";
import { etiquetaRol } from "@/lib/roles";
import { SheetInvitarUsuario } from "@/components/pwa/sheet-invitar-usuario";
import type { EmpresaOpcion, UsuarioAdmin } from "@/lib/consultas";

type Props = {
  usuarios: UsuarioAdmin[];
  empresas: EmpresaOpcion[];
};

export function UsuariosAdminGeneral({ usuarios, empresas }: Props) {
  return (
    <div className="flex flex-col gap-3 px-5 py-3 pb-8">
      <header className="px-1 pt-3 pb-2">
        <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
        <p className="text-base font-medium text-gray-400">{usuarios.length} en la organización</p>
      </header>

      <SheetInvitarUsuario empresas={empresas} />

      <section className="flex flex-col gap-3">
        {usuarios.map((usuario) => {
          const nombre = usuario.nombre ?? usuario.email ?? "Sin nombre";

          return (
            <div key={usuario.id} className="flex items-center gap-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef9ec] text-sm font-bold text-green-700">
                {obtenerIniciales(nombre)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-800">{nombre}</p>
                <p className="truncate text-xs text-gray-400">{usuario.email}</p>
                <p className="mt-1 truncate text-xs font-semibold text-gray-500">
                  {etiquetaRol(usuario.rolGlobal)}
                  {usuario.empresasAsignadas.length > 0 && ` · ${usuario.empresasAsignadas.join(", ")}`}
                </p>
              </div>

              {!usuario.activo && (
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-400 uppercase">Inactivo</span>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
