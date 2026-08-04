"use client";

import { useRef, useState } from "react";
import {
  Palette,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  ImagePlus,
  X,
} from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type { FotoFirmada, NotaVisita as TipoNotaVisita } from "@/lib/tipos";

export function NotaVisita({
  idCita,
  idManicurista,
  notaInicial,
  fotosIniciales,
}: {
  idCita: string;
  idManicurista: string;
  notaInicial: TipoNotaVisita | null;
  fotosIniciales: FotoFirmada[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [formulaColor, setFormulaColor] = useState(notaInicial?.formula_color ?? "");
  const [notas, setNotas] = useState(notaInicial?.notas ?? "");
  const [fotos, setFotos] = useState<FotoFirmada[]>(fotosIniciales);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputArchivo = useRef<HTMLInputElement>(null);

  const tieneAlgo = Boolean(notaInicial) || fotos.length > 0;

  async function guardarTexto() {
    setGuardando(true);
    setGuardado(false);
    setError(null);
    const supabase = crearClienteNavegador();
    const { error: errorGuardar } = await supabase.from("notas_visita").upsert(
      {
        id_cita: idCita,
        id_manicurista: idManicurista,
        formula_color: formulaColor || null,
        notas: notas || null,
      },
      { onConflict: "id_cita" },
    );
    setGuardando(false);
    if (errorGuardar) setError(errorGuardar.message);
    else setGuardado(true);
  }

  async function subirFotos(archivos: FileList) {
    setSubiendo(true);
    setError(null);
    const supabase = crearClienteNavegador();
    const nuevasRutas: string[] = [];

    for (const archivo of Array.from(archivos)) {
      const ruta = `${idManicurista}/${idCita}/${crypto.randomUUID()}-${archivo.name}`;
      const { error: errorSubir } = await supabase.storage
        .from("fotos-clientas")
        .upload(ruta, archivo);

      if (errorSubir) {
        setError(errorSubir.message);
        continue;
      }
      nuevasRutas.push(ruta);
    }

    if (nuevasRutas.length > 0) {
      const rutasActuales = [...fotos.map((f) => f.ruta), ...nuevasRutas];
      await supabase.from("notas_visita").upsert(
        { id_cita: idCita, id_manicurista: idManicurista, rutas_fotos: rutasActuales },
        { onConflict: "id_cita" },
      );

      const { data: firmadas } = await supabase.storage
        .from("fotos-clientas")
        .createSignedUrls(nuevasRutas, 3600);

      if (firmadas) {
        setFotos((actual) => [
          ...actual,
          ...firmadas
            .filter((f): f is typeof f & { signedUrl: string } => Boolean(f.signedUrl))
            .map((f) => ({ ruta: f.path!, url: f.signedUrl })),
        ]);
      }
    }

    setSubiendo(false);
  }

  async function borrarFoto(foto: FotoFirmada) {
    const supabase = crearClienteNavegador();
    await supabase.storage.from("fotos-clientas").remove([foto.ruta]);
    const rutasRestantes = fotos.filter((f) => f.ruta !== foto.ruta).map((f) => f.ruta);
    await supabase
      .from("notas_visita")
      .upsert(
        { id_cita: idCita, id_manicurista: idManicurista, rutas_fotos: rutasRestantes },
        { onConflict: "id_cita" },
      );
    setFotos((actual) => actual.filter((f) => f.ruta !== foto.ruta));
  }

  return (
    <div className="mt-2 rounded-xl border border-borde bg-fondo p-3">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-rosado-texto transition-colors hover:text-texto-primario"
      >
        {abierto ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : tieneAlgo ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <Palette className="h-3.5 w-3.5" />
        )}
        {abierto
          ? "Ocultar nota de la visita"
          : tieneAlgo
            ? "Ver nota de la visita"
            : "Agregar nota de la visita"}
      </button>

      {abierto && (
        <div className="animar-aparecer mt-3 flex flex-col gap-3">
          <label className="text-xs text-texto-secundario">
            Fórmula de color
            <input
              value={formulaColor}
              onChange={(e) => setFormulaColor(e.target.value)}
              placeholder="Ej: OPI Bubble Bath + top coat mate"
              className="mt-1 w-full rounded-lg border border-borde bg-superficie px-3 py-2 text-sm text-texto-primario transition-colors focus:border-rosado focus:outline-none"
            />
          </label>
          <label className="text-xs text-texto-secundario">
            Notas
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="mt-1 w-full rounded-lg border border-borde bg-superficie px-3 py-2 text-sm text-texto-primario transition-colors focus:border-rosado focus:outline-none"
            />
          </label>

          {error && <p className="text-xs text-alerta">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={guardarTexto}
              disabled={guardando}
              className="flex items-center gap-1.5 rounded-full bg-rosado px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {guardando ? "Guardando…" : "Guardar"}
            </button>
            {guardado && (
              <span className="animar-aparecer flex items-center gap-1 text-xs text-exito">
                <CheckCircle2 className="h-3.5 w-3.5" /> Guardado
              </span>
            )}
          </div>

          <div>
            <input
              ref={inputArchivo}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              hidden
              onChange={(e) => e.target.files && subirFotos(e.target.files)}
            />
            <button
              type="button"
              onClick={() => inputArchivo.current?.click()}
              disabled={subiendo}
              className="flex items-center gap-1.5 text-xs font-semibold text-texto-secundario transition-colors hover:text-texto-primario disabled:opacity-50"
            >
              {subiendo ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5" />
              )}
              {subiendo ? "Subiendo…" : "Agregar fotos"}
            </button>
          </div>

          {fotos.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {fotos.map((foto) => (
                <div key={foto.ruta} className="group relative">
                  <a href={foto.url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={foto.url}
                      alt="Foto de la visita"
                      className="aspect-square w-full rounded-lg object-cover shadow-sm transition-transform group-hover:scale-105"
                    />
                  </a>
                  <button
                    type="button"
                    onClick={() => borrarFoto(foto)}
                    aria-label="Borrar foto"
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
