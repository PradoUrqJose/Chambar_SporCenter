import { createClient } from "@supabase/supabase-js";

// Cliente sin cookie de sesión (service role, bypassa RLS): solo para datos
// no sensibles por usuario que se leen dentro de unstable_cache. Next.js no
// permite leer cookies() dentro de una función envuelta en unstable_cache
// (y el cliente normal en lib/supabase/server.ts depende de la cookie de
// sesión para autenticar), así que estas consultas necesitan un cliente
// aparte que no la necesite.
//
// Úsalo únicamente para catálogos globales o ya filtrados por un empresaId
// que el llamador ya validó (categorías, stands activos) — nunca para datos
// que dependan de quién es el usuario actual.
export function createServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}
