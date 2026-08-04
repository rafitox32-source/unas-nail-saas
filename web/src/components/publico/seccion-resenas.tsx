import { Star, Quote } from "lucide-react";
import type { ResenaPublica } from "@/lib/tipos";

function Estrellas({ valor }: { valor: number }) {
  return (
    <div className="flex gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= valor ? "fill-dorado text-dorado" : "text-borde"}`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export function SeccionResenas({ resenas }: { resenas: ResenaPublica[] }) {
  if (resenas.length === 0) return null;

  return (
    <section id="resenas" className="border-t border-borde bg-fondo px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-titulo text-center text-3xl font-semibold text-texto-primario">
          Lo que dicen mis clientas
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resenas.map((resena) => (
            <div
              key={resena.id}
              className="flex flex-col gap-3 rounded-2xl border border-borde bg-superficie p-6 shadow-sm"
            >
              <Quote className="h-5 w-5 text-rosado-texto" strokeWidth={1.5} />
              <p className="flex-1 text-sm text-texto-primario">{resena.comentario}</p>
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-sm font-semibold text-texto-secundario">
                  {resena.nombre_clienta}
                </span>
                <span className="shrink-0">
                  <Estrellas valor={resena.calificacion} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
