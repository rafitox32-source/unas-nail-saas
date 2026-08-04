import { Sparkles, Scissors, Eye, User } from "lucide-react";
import type { Personal, CategoriaServicio } from "@/lib/tipos";

const ETIQUETA_CATEGORIA: Record<CategoriaServicio, string> = {
  cabello: "Cabello",
  pestañas: "Pestañas",
  uñas: "Uñas",
  otro: "Otro",
};

const ICONO_CATEGORIA: Record<CategoriaServicio, typeof Sparkles> = {
  cabello: Scissors,
  pestañas: Eye,
  uñas: Sparkles,
  otro: Sparkles,
};

export function SeccionEquipo({ personal }: { personal: Personal[] }) {
  if (personal.length === 0) return null;

  return (
    <section id="equipo" className="border-t border-borde bg-superficie px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="font-titulo text-center text-3xl font-semibold text-texto-primario">
          Nuestro equipo
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3">
          {personal.map((persona) => {
            const IconoCategoria = ICONO_CATEGORIA[persona.categoria];
            return (
              <div key={persona.id} className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-borde bg-rosado-suave">
                  {persona.url_foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={persona.url_foto}
                      alt={persona.nombre}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-rosado-texto" strokeWidth={1.5} />
                  )}
                </div>
                <p className="font-semibold text-texto-primario">{persona.nombre}</p>
                <p className="flex items-center gap-1 text-xs text-texto-secundario">
                  <IconoCategoria className="h-3 w-3" />
                  {ETIQUETA_CATEGORIA[persona.categoria]}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
