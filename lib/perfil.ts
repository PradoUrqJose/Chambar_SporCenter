import { cache } from "react";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { RolGlobal } from "@/lib/roles";

export type { RolGlobal } from "@/lib/roles";

export type Perfil = {
  id: string;
  nombre: string | null;
  email: string | null;
  rol_global: RolGlobal;
  activo: boolean;
};

export const obtenerPerfilActual = cache(async (): Promise<Perfil | null> => {
  const tTotal = performance.now();
  const supabase = await createClient();

  // proxy.ts ya valida la sesión con auth.getUser() y propaga el id acá,
  // así evitamos repetir ese round-trip en cada Server Component.
  let userId = (await headers()).get("x-user-id");

  if (!userId) {
    const tGetUser = performance.now();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log(`[TIMING] obtenerPerfilActual getUser(): ${(performance.now() - tGetUser).toFixed(0)}ms`);
    userId = user?.id ?? null;
  }

  if (!userId) return null;

  const tPerfil = performance.now();
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, nombre, email, rol_global, activo")
    .eq("id", userId)
    .single();
  console.log(`[TIMING] obtenerPerfilActual query perfiles: ${(performance.now() - tPerfil).toFixed(0)}ms`);
  console.log(`[TIMING] obtenerPerfilActual TOTAL: ${(performance.now() - tTotal).toFixed(0)}ms`);

  return perfil;
});
