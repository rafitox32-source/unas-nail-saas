"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X, ArrowLeft, ArrowRight, GalleryHorizontalEnd } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type { FotoGaleriaAdmin } from "@/lib/tipos";

export function GestionGaleria({
  idManicurista,
  fotosIniciales,
}: {
  idManicurista: string;
  fotosIniciales: FotoGaleriaAdmin[];
}) {
  const [fotos, setFotos] = useState(fotosIniciales);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputArchivo = useRef<HTMLInputElement>(null);

  async function subirFotos(archivos: FileList) {
    setSubiendo(true);
    setError(null);
    const supabase = crearClienteNavegador();
    let siguienteOrden = fotos.length > 0 ? Math.max(...fotos.map((f) => f.orden)) + 1 : 0;
    const nuevas: FotoGaleriaAdmin[] = [];

    for (const archivo of Array.from(archivos)) {
      const ruta = `${idManicurista}/${crypto.randomUUID()}-${archivo.name}`;
      const { error: errorSubir } = await supabase.storage
        .from("fotos-galeria")
        .upload(ruta, archivo);

      if (errorSubir) {
        setError(errorSubir.message);
        continue;
      }

      const { data: fila, error: errorFila } = await supabase
        .from("fotos_galeria")
        .insert({ id_manicurista: idManicurista, ruta_archivo: ruta, orden: siguienteOrden })
        .select("id, ruta_archivo, orden")
        .single<{ id: string; ruta_archivo: string; orden: number }>();

      if (errorFila || !fila) {
        setError(errorFila?.message ?? "No se pudo guardar la foto.");
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("fotos-galeria").getPublicUrl(ruta);

      nuevas.push({ id: fila.id, ruta_archivo: fila.ruta_archivo, orden: fila.orden, url: publicUrl });
      siguienteOrden += 1;
    }

    if (nuevas.length > 0) {
      setFotos((actual) => [...actual, ...nuevas].sort((a, b) => a.orden - b.orden));
    }
    setSubiendo(false);
  }

  async function borrarFoto(foto: FotoGaleriaAdmin) {
    const supabase = crearClienteNavegador();
    await supabase.storage.from("fotos-galeria").remove([foto.ruta_archivo]);
    await supabase.from("fotos_galeria").delete().eq("id", foto.id);
    setFotos((actual) => actual.filter((f) => f.id !== foto.id));
  }

  async function moverFoto(indice: number, direccion: -1 | 1) {
    const destino = indice + direccion;
    if (destino < 0 || destino >= fotos.length) return;

    const actualizadas = [...fotos];
    [actualizadas[indice], actualizadas[destino]] = [actualizadas[destino], actualizadas[indice]];

    const supabase = crearClienteNavegador();
    await Promise.all([
      supabase.from("fotos_galeria").update({ orden: indice }).eq("id", actualizadas[indice].id),
      supabase.from("fotos_galeria").update({ orden: destino }).eq("id", actualizadas[destino].id),
    ]);

    setFotos(
      actualizadas.map((f, i) => ({
        ...f,
        orden: i === indice ? indice : i === destino ? destino : f.orden,
      })),
    );
  }

  return (
    <div className="mt-8">
      <h2 className="font-titulo text-lg font-semibold text-texto-primario">
        Galería pública
      </h2>
      <p className="mt-1 text-sm text-texto-secundario">
        Las fotos que subas acá reemplazan los diseños de ejemplo en tu carta pública.
      </p>

      <div className="mt-4 rounded-2xl border border-borde bg-superficie p-5 shadow-sm">
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
          className="flex items-center gap-1.5 rounded-full bg-rosado px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {subiendo ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          {subiendo ? "Subiendo…" : "Subir fotos"}
        </button>

        {error && <p className="mt-3 text-sm text-alerta">{error}</p>}

        {fotos.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-borde py-10 text-center">
            <GalleryHorizontalEnd className="h-7 w-7 text-texto-secundario" strokeWidth={1.5} />
            <p className="text-sm text-texto-secundario">Todavía no subiste fotos.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {fotos.map((foto, indice) => (
              <div key={foto.id} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.url}
                  alt="Foto de la galería"
                  className="aspect-square w-full rounded-xl object-cover shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => borrarFoto(foto)}
                  aria-label="Borrar foto"
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="absolute bottom-1.5 left-1.5 flex gap-1">
                  <button
                    type="button"
                    onClick={() => moverFoto(indice, -1)}
                    disabled={indice === 0}
                    aria-label="Mover antes"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:opacity-30"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moverFoto(indice, 1)}
                    disabled={indice === fotos.length - 1}
                    aria-label="Mover después"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:opacity-30"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
