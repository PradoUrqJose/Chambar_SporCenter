"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  desde?: string;
  hasta?: string;
};

export function FiltroFechasHistorial({ desde, hasta }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function actualizar(clave: "desde" | "hasta", valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("sesion");
    if (valor) params.set(clave, valor);
    else params.delete(clave);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={desde ?? ""}
        onChange={(evento) => actualizar("desde", evento.target.value)}
        className="rounded-[10px] border border-border bg-card px-3 py-2 text-[13px] text-foreground outline-none focus:border-ring"
      />
      <span className="text-sm text-muted-foreground">–</span>
      <input
        type="date"
        value={hasta ?? ""}
        onChange={(evento) => actualizar("hasta", evento.target.value)}
        className="rounded-[10px] border border-border bg-card px-3 py-2 text-[13px] text-foreground outline-none focus:border-ring"
      />
    </div>
  );
}
