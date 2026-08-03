"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";

export function BotonCerrarSesion() {
  const router = useRouter();

  async function alHacerClic() {
    const supabase = crearClienteNavegador();
    await supabase.auth.signOut();
    router.push("/ingresar");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={alHacerClic}
      aria-label="Cerrar sesión"
      className="flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-rosado transition-colors hover:text-texto-primario"
    >
      <LogOut className="h-4 w-4" strokeWidth={1.75} />
      <span className="hidden sm:inline">Cerrar sesión</span>
    </button>
  );
}
