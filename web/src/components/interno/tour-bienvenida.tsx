"use client";

import { useState } from "react";
import {
  Sparkles,
  Palette,
  Scissors,
  Share2,
  CalendarCheck,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";

interface Paso {
  icono: typeof Sparkles;
  titulo: string;
  texto: string;
}

function pasos(slugPublico: string | null): Paso[] {
  return [
    {
      icono: Sparkles,
      titulo: "¡Bienvenida a tu panel!",
      texto:
        "Acá vas a gestionar tus reservas, clientas y todo tu negocio. Este recorrido dura menos de un minuto.",
    },
    {
      icono: Palette,
      titulo: "Personalizá tu marca",
      texto:
        "Cargá el nombre, color y logo de tu negocio desde Inicio, en \"Mi negocio\" — se aplica en tu página pública al instante.",
    },
    {
      icono: Scissors,
      titulo: "Cargá tus servicios",
      texto:
        "Agregá tus servicios con precio, duración y seña desde la sección \"Servicios\". Sin esto, tus clientas no van a poder reservar.",
    },
    {
      icono: Share2,
      titulo: "Compartí tu link",
      texto: slugPublico
        ? `Tu página pública es /${slugPublico} — mandala por WhatsApp, o generá una imagen con QR para tus redes desde "Promociones".`
        : 'Vas a tener una página pública propia para compartir por WhatsApp, o podés generar una imagen con QR para tus redes desde "Promociones".',
    },
    {
      icono: CalendarCheck,
      titulo: "Gestioná tu agenda",
      texto:
        "Confirmá señas, marcá citas como completadas y mirá tus ingresos, todo desde \"Agenda\" e Inicio.",
    },
  ];
}

export function TourBienvenida({
  idManicurista,
  slugPublico,
}: {
  idManicurista: string;
  slugPublico: string | null;
}) {
  const [visible, setVisible] = useState(true);
  const [paso, setPaso] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const listaPasos = pasos(slugPublico);
  const esUltimoPaso = paso === listaPasos.length - 1;

  async function cerrar() {
    setGuardando(true);
    const supabase = crearClienteNavegador();
    await supabase
      .from("usuarios_manicuristas")
      .update({ tour_completado: true })
      .eq("id", idManicurista);
    setGuardando(false);
    setVisible(false);
  }

  if (!visible) return null;

  const { icono: Icono, titulo, texto } = listaPasos[paso];

  return (
    <div className="animar-fondo-modal fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6">
      <div className="animar-hoja-modal w-full max-w-sm rounded-t-3xl bg-superficie p-6 shadow-2xl sm:animar-tarjeta-modal sm:rounded-3xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rosado-suave">
            <Icono className="h-7 w-7 text-rosado-texto" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-titulo text-xl font-semibold text-texto-primario">{titulo}</h2>
            <p className="mt-2 text-sm text-texto-secundario">{texto}</p>
          </div>

          <div className="flex items-center gap-1.5" role="tablist" aria-label="Progreso del recorrido">
            {listaPasos.map((_, indice) => (
              <span
                key={indice}
                className={`h-1.5 rounded-full transition-all ${
                  indice === paso ? "w-5 bg-rosado" : "w-1.5 bg-borde"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={cerrar}
            disabled={guardando}
            className="text-sm text-texto-secundario disabled:opacity-50"
          >
            Omitir
          </button>
          <div className="flex items-center gap-2">
            {paso > 0 && (
              <button
                type="button"
                onClick={() => setPaso((p) => p - 1)}
                aria-label="Paso anterior"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-borde text-texto-secundario transition-colors hover:text-texto-primario"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => (esUltimoPaso ? cerrar() : setPaso((p) => p + 1))}
              disabled={guardando}
              className="flex items-center gap-1.5 rounded-full bg-rosado px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {esUltimoPaso ? "Empezar" : "Siguiente"}
              {!esUltimoPaso && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
