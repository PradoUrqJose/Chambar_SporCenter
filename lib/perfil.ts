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
  const supabase = await createClient();

  // proxy.ts ya valida la sesión con auth.getUser() y propaga el id acá,
  // así evitamos repetir ese round-trip en cada Server Component.
  let userId = (await headers()).get("x-user-id");

  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  if (!userId) return null;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, nombre, email, rol_global, activo")
    .eq("id", userId)
    .single();

  return perfil;
});
