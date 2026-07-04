import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const RUTAS_PUBLICAS = ["/login", "/recuperar", "/auth"];

function esRutaPublica(pathname: string) {
  return RUTAS_PUBLICAS.some((ruta) => pathname.startsWith(ruta));
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
