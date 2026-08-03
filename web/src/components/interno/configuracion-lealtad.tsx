"use client";

import { useState } from "react";
import { Gift, Loader2, CheckCircle2 } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type { ProgramaLealtad } from "@/lib/tipos";

export function ConfiguracionLealtad({
  idManicurista,
  configuracionInicial,
}: {
  idManicurista: string;
  configuracionInicial: ProgramaLealtad;
}) {
  const [activo, setActivo] = useState(configuracionInicial.lealtad_activo);
  const [visitasObjetivo, setVisitasObjetivo] = useState(
    configuracionInicial.lealtad_visitas_objetivo != null
      ? String(configuracionInicial.lealtad_visitas_objetivo)
      : "5",
  );
  const [premioDescripcion, setPremioDescripcion] = useState(
    configuracionInicial.lealtad_premio_descripcion ?? "",
  );
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    setGuardando(true);
    setGuardado(false);
    setError(null);

    const supabase = crearClienteNavegador();
    const { error: errorGuardar } = await supabase
      .from("usuarios_manicuristas")
      .update({
        lealtad_activo: activo,
        lealtad_visitas_objetivo: Number(visitasObjetivo),
        lealtad_premio_descripcion: premioDescripcion || null,
      })
      .eq("id", idManicurista);

    setGuardando(false);
    if (errorGuardar) setError(errorGuardar.message);
    else setGuardado(true);
  }

  return (
    <div className="mt-8">
      <h2 className="font-titulo text-lg font-semibold text-texto-primario">
        Programa de lealtad
      </h2>
      <p className="mt-1 text-sm text-texto-secundario">
        Premiá a tus clientas frecuentes cada cierta cantidad de visitas completadas.
      </p>

      <form
        onSubmit={guardar}
        className="mt-4 flex flex-col gap-4 rounded-2xl border border-borde bg-superficie p-5 shadow-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-rosado" />
            <span className="text-sm font-semibold text-texto-primario">Programa activo</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={activo}
            aria-label={activo ? "Desactivar programa de lealtad" : "Activar programa de lealtad"}
            onClick={() => setActivo((valor) => !valor)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              activo ? "bg-rosado" : "bg-borde"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                activo ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <label className="text-sm text-texto-secundario">
          Visitas por premio
          <input
            required
            type="number"
            min={2}
            value={visitasObjetivo}
            onChange={(e) => setVisitasObjetivo(e.target.value)}
            className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
          />
        </label>

        <label className="text-sm text-texto-secundario">
          Descripción del premio
          <input
            required
            value={premioDescripcion}
            onChange={(e) => setPremioDescripcion(e.target.value)}
            placeholder="Diseño gratis en tu próxima visita"
            className="mt-1 w-full rounded-xl border border-borde bg-fondo px-4 py-2.5 text-texto-primario transition-colors focus:border-rosado focus:outline-none"
          />
        </label>

        {error && <p className="text-sm text-alerta">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={guardando}
            className="flex items-center gap-1.5 rounded-full bg-rosado px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            {guardando ? "Guardando…" : "Guardar"}
          </button>
          {guardado && (
            <span className="animar-aparecer flex items-center gap-1 text-xs text-exito">
              <CheckCircle2 className="h-3.5 w-3.5" /> Guardado
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
