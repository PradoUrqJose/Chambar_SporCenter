"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ActualizarPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [cargando, setCargando] = useState(false);

  async function actualizarPassword(evento: React.FormEvent) {
    evento.preventDefault();

    if (password !== confirmacion) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setCargando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setCargando(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Contraseña actualizada");
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={actualizarPassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(evento) => setPassword(evento.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmacion">Confirmar contraseña</Label>
        <Input
          id="confirmacion"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={confirmacion}
          onChange={(evento) => setConfirmacion(evento.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={cargando}>
        {cargando ? "Guardando..." : "Guardar contraseña"}
      </Button>
    </form>
  );
}
