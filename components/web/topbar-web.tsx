import { obtenerIniciales } from "@/lib/formato";
import { BuscadorTopbar } from "@/components/web/buscador-topbar";

type Props = {
  nombre: string | null;
  email: string | null;
};

export function TopbarWeb({ nombre, email }: Props) {
  const nombreMostrado = nombre ?? email ?? "Usuario";

  return (
    <header className="flex items-center gap-[18px] border-b border-border px-[30px] py-[22px]">
      <BuscadorTopbar />

      <div className="ml-auto flex items-center gap-[11px]">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">
          {obtenerIniciales(nombreMostrado)}
        </div>
        <div>
          <div className="text-sm font-bold">{nombreMostrado}</div>
          {email && <div className="text-xs text-muted-foreground">{email}</div>}
        </div>
      </div>
    </header>
  );
}
