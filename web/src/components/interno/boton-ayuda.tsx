"use client";

import { HelpCircle } from "lucide-react";
import { urlWhatsappSoporte } from "@/lib/soporte";

export function BotonAyuda({ nombreNegocio }: { nombreNegocio?: string }) {
  const mensaje = nombreNegocio
    ? `Hola! Necesito ayuda con mi panel de ${nombreNegocio}.`
    : "Hola! Necesito ayuda con mi panel.";

  return (
    <a
      href={urlWhatsappSoporte(mensaje)}
      target="_blank"
      rel="noreferrer"
      aria-label="Ayuda por WhatsApp"
      title="¿Algo no anda bien? Escribinos"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-texto-secundario transition-colors hover:bg-borde/50 hover:text-texto-primario"
    >
      <HelpCircle className="h-4 w-4" />
    </a>
  );
}
