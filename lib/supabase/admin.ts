import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client con service_role — bypassa RLS por completo. Solo para operaciones
// de Auth Admin (invitar usuarios) que no se pueden hacer con el cliente
// normal. Nunca importar esto desde un componente cliente.
export function createAdminClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
