import { Building2Icon, StoreIcon, UsersIcon } from "lucide-react";
import { obtenerIniciales } from "@/lib/formato";
import { oscurecerColor } from "@/lib/color";
import type { EmpresaResumen, ResumenOrganizacion } from "@/lib/consultas";

type Props = {
  nombreUsuario: string | null;
  resumen: ResumenOrganizacion;
  empresas: EmpresaResumen[];
};

const COLOR_POR_DEFECTO = "#006d36";

export function InicioAdminGeneral({ nombreUsuario, resumen, empresas }: Props) {
  return (
    <div className="flex flex-col gap-3 px-5 py-3">
      <header className="px-1 pt-3 pb-2">
        <p className="mb-1 text-base font-medium text-gray-400">Hola, {nombreUsuario}</p>
        <h1 className="text-2xl leading-tight font-bold text-gray-800">Resumen de la organización</h1>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-2 rounded-2xl border border-gray-50 bg-white p-4 shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef9ec] text-green-700">
            <Building2Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{resumen.empresasActivas}</p>
            <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Empresas</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-gray-50 bg-white p-4 shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <UsersIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{resumen.usuariosTotales}</p>
            <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Usuarios</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-2xl border border-gray-50 bg-white p-4 shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <StoreIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{resumen.standsActivos}</p>
            <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Stands</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 px-1 text-sm font-bold text-gray-800">Empresas</h3>
        <div className="flex flex-col gap-3">
          {empresas.map((empresa) => {
            const color = empresa.color ?? COLOR_POR_DEFECTO;

            return (
              <div key={empresa.id} className="flex items-center gap-4 rounded-2xl border border-gray-50 bg-white p-4 shadow-sm">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${color}, ${oscurecerColor(color, 0.55)})` }}
                >
                  {obtenerIniciales(empresa.nombre)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-800">{empresa.nombre}</p>
                  <p className="truncate text-xs text-gray-400">
                    {empresa.standsCount} {empresa.standsCount === 1 ? "stand" : "stands"} · {empresa.usuariosCount}{" "}
                    {empresa.usuariosCount === 1 ? "usuario" : "usuarios"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
