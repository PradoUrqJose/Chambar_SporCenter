import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const siguiente = searchParams.get("next") ?? "/";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      const destino = request.nextUrl.clone();
      destino.pathname = siguiente;
      destino.search = "";
      return NextResponse.redirect(destino);
    }
  }

  const destino = request.nextUrl.clone();
  destino.pathname = "/login";
  destino.search = "";
  return NextResponse.redirect(destino);
}
