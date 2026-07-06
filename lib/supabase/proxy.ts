import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const RUTAS_PUBLICAS = ["/login", "/recuperar", "/auth"];

function esRutaPublica(pathname: string) {
  return RUTAS_PUBLICAS.some((ruta) => pathname.startsWith(ruta));
}

// La web (/panel/*) es de escritorio; un celular en el navegador (no
// instalado como PWA, eso ya lo resuelve RedirigirSegunModo en el cliente)
// no debe verla ni siquiera al recargar la página directo.
const REGEX_USER_AGENT_MOVIL = /Android|iPhone|iPod|Mobile|Windows Phone|BlackBerry/i;

function esUserAgentMovil(userAgent: string) {
  return REGEX_USER_AGENT_MOVIL.test(userAgent);
}

// Solo estas secciones de /panel/* comparten nombre 1:1 con su equivalente
// de la PWA (/panel/inicio -> /inicio, /panel/caja -> /caja). Las demás
// (empresas, stands, categorías, reportes) son exclusivas de la web —no
// tienen pantalla en la PWA— así que un celular ahí no puede mandarse a una
// ruta que no existe: cae a "/inicio" como fallback seguro.
const SECCIONES_PANEL_CON_EQUIVALENTE_PWA = new Set(["inicio", "cajas", "historial", "usuarios", "ajustes", "caja"]);

function rutaPwaEquivalente(pathname: string): string {
  const seccion = pathname.split("/")[2];
  return seccion && SECCIONES_PANEL_CON_EQUIVALENTE_PWA.has(seccion) ? `/${seccion}` : "/inicio";
}

export async function updateSession(request: NextRequest) {
  let cookiesActualizadas: {
    name: string;
    value: string;
    options: CookieOptions;
  }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesActualizadas = cookiesToSet;
        },
      },
    },
  );

  const tGetUser = performance.now();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log(`[TIMING] proxy getUser() ${request.nextUrl.pathname}: ${(performance.now() - tGetUser).toFixed(0)}ms`);

  if (!user && !esRutaPublica(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname.startsWith("/panel/") && esUserAgentMovil(request.headers.get("user-agent") ?? "")) {
    const url = request.nextUrl.clone();
    url.pathname = rutaPwaEquivalente(request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Se propaga el id ya validado para que los Server Components no tengan
  // que repetir el round-trip a supabase.auth.getUser().
  const requestHeaders = new Headers(request.headers);
  if (user) requestHeaders.set("x-user-id", user.id);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  cookiesActualizadas.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options),
  );

  return response;
}
