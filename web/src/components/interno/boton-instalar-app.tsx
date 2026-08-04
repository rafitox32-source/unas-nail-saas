"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface EventoInstalacion extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Solo Chrome/Android disparan este evento — en iOS Safari no existe una
// API para instalar por botón, ahí sigue siendo el paso manual
// ("Compartir" → "Agregar a inicio") documentado en el manual. Este
// componente no muestra nada si el evento nunca llega, así que en iOS
// simplemente no aparece.
export function BotonInstalarApp() {
  const [evento, setEvento] = useState<EventoInstalacion | null>(null);

  useEffect(() => {
    function alDisponible(e: Event) {
      e.preventDefault();
      setEvento(e as EventoInstalacion);
    }
    function alInstalar() {
      setEvento(null);
    }
    window.addEventListener("beforeinstallprompt", alDisponible);
    window.addEventListener("appinstalled", alInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", alDisponible);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, []);

  if (!evento) return null;

  async function instalar() {
    if (!evento) return;
    await evento.prompt();
    await evento.userChoice;
    setEvento(null);
  }

  return (
    <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-rosado/30 bg-rosado-suave p-4 shadow-sm">
      <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-texto-primario">
        <Download className="h-4 w-4 shrink-0 text-rosado-texto" />
        <span className="truncate">Instalá tu panel como app</span>
      </span>
      <button
        type="button"
        onClick={instalar}
        className="shrink-0 rounded-full bg-rosado px-4 py-2 text-xs font-semibold text-white transition-transform hover:-translate-y-0.5"
      >
        Instalar
      </button>
    </div>
  );
}
