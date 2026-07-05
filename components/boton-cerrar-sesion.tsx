"use client";

import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function BotonCerrarSesion() {
  const router = useRouter();

  async function cerrarSesion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={cerrarSesion}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 py-3.5 text-sm font-bold text-red-600"
    >
      <LogOutIcon className="h-4 w-4" />
      Cerrar sesión
    </button>
  );
}
