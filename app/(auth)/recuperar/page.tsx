"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function enviarEnlace(evento: React.FormEvent) {
    evento.preventDefault();
    setCargando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/actualizar-password`,
    });

    setCargando(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setEnviado(true);
  }

  if (enviado) {
    return (
      <p className="text-center text-sm">
        Si el correo existe, te enviamos un enlace para restablecer tu
        contraseña. Revisa tu bandeja de entrada.
      </p>
    );
  }

  return (
    <form onSubmit={enviarEnlace} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={cargando}>
        {cargando ? "Enviando..." : "Enviar enlace"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="hover:text-primary">
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}
