"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  async function iniciarSesion(evento: React.FormEvent) {
    evento.preventDefault();
    setCargando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setCargando(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <>
      {/* Desktop (web): panel split oscuro con degradado, mismo estilo que la PWA */}
      <div className="hidden min-h-screen md:flex">
        <div className="relative flex flex-[1.1] flex-col items-start justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#dfeeff_0%,#a9c9f5_12%,#4d7fe0_32%,#1230a8_55%,#060a2e_78%,#000000_100%)] px-16 py-20">
          <div className="mb-14 flex items-center gap-3">
            <Wallet className="size-9 text-white" />
            <span className="text-2xl font-medium tracking-wide text-white">
              Chambar
            </span>
          </div>
          <h1 className="mb-5 max-w-lg text-5xl font-extrabold leading-tight text-white">
            Gestión financiera centralizada
          </h1>
          <p className="max-w-md text-base leading-relaxed text-white/75">
            Controla el flujo de caja de cada empresa y cada stand desde un
            solo lugar.
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center bg-[#0a0a14] px-12 py-16">
          <div className="w-full max-w-sm">
            <h2 className="mb-3 text-3xl font-extrabold text-white">
              Iniciar sesión
            </h2>
            <p className="mb-8 text-[14.5px] leading-relaxed text-white/65">
              Ingresa tu correo y contraseña para acceder a tu cuenta.
            </p>

            <form onSubmit={iniciarSesion} className="space-y-4">
              <Input
                type="email"
                placeholder="Correo electrónico"
                autoComplete="email"
                required
                aria-label="Correo electrónico"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                className="h-13 rounded-full border-white/10 bg-white/[0.06] px-6 text-[15px] text-white placeholder:text-white/45 focus-visible:border-white/30 focus-visible:ring-white/20"
              />
              <Input
                type="password"
                placeholder="Contraseña"
                autoComplete="current-password"
                required
                aria-label="Contraseña"
                value={password}
                onChange={(evento) => setPassword(evento.target.value)}
                className="h-13 rounded-full border-white/10 bg-white/[0.06] px-6 text-[15px] text-white placeholder:text-white/45 focus-visible:border-white/30 focus-visible:ring-white/20"
              />
              <Button
                type="submit"
                disabled={cargando}
                className="h-13 w-full rounded-full bg-gradient-to-r from-[#6f8fe8] to-[#9fd8f0] text-[15px] font-bold text-[#0a0a14] hover:opacity-90"
              >
                {cargando ? "Ingresando..." : "Iniciar sesión"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-white/65">
              <Link
                href="/recuperar"
                className="font-semibold text-white hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Mobile: pantalla completa con degradado */}
      <div className="pt-safe pb-safe flex min-h-screen flex-col bg-[radial-gradient(circle_at_50%_18%,#dfeeff_0%,#a9c9f5_12%,#4d7fe0_32%,#1230a8_55%,#060a2e_78%,#000000_100%)] md:hidden">
        <div className="flex items-center justify-center gap-3 pt-16">
          <Wallet className="size-8 text-white" />
          <span className="text-3xl font-medium tracking-wide text-white">
            Chambar
          </span>
        </div>

        <div className="flex-1" />

        <div className="px-6 pb-10">
          <h1 className="mb-3 text-center text-[32px] font-extrabold text-white">
            Bienvenido de nuevo
          </h1>
          <p className="mb-7 px-2 text-center text-[14.5px] leading-relaxed text-white/75">
            Ingresa tu correo y contraseña para acceder a tu cuenta.
          </p>

          <form onSubmit={iniciarSesion} className="space-y-4">
            <Input
              type="email"
              placeholder="Correo electrónico"
              autoComplete="email"
              required
              aria-label="Correo electrónico"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              className="h-14 rounded-full border-white/10 bg-white/[0.06] px-6 text-[15px] text-white placeholder:text-white/45 focus-visible:border-white/30 focus-visible:ring-white/20"
            />
            <Input
              type="password"
              placeholder="Contraseña"
              autoComplete="current-password"
              required
              aria-label="Contraseña"
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
              className="h-14 rounded-full border-white/10 bg-white/[0.06] px-6 text-[15px] text-white placeholder:text-white/45 focus-visible:border-white/30 focus-visible:ring-white/20"
            />
            <Button
              type="submit"
              disabled={cargando}
              className="h-14 w-full rounded-full bg-gradient-to-r from-[#6f8fe8] to-[#9fd8f0] text-[16px] font-bold text-[#0a0a14] hover:opacity-90"
            >
              {cargando ? "Ingresando..." : "Iniciar sesión"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-white/65">
            <Link
              href="/recuperar"
              className="font-semibold text-white hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
