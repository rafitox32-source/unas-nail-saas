"use client";

import { useState } from "react";
import { Sparkles, Scissors, Eye, Shirt, CakeSlice } from "lucide-react";
import { IconoPosteBarbero } from "@/components/iconos-barberia";
import { IconoDiente } from "@/components/icono-diente";
import { TarjetaServicio } from "@/components/publico/tarjeta-servicio";
import { ModalReserva } from "@/components/publico/modal-reserva";
import type { Servicio, Personal, CategoriaServicio } from "@/lib/tipos";

const ORDEN_CATEGORIAS: CategoriaServicio[] = [
  "cabello",
  "barberia",
  "pestañas",
  "uñas",
  "costura",
  "postres",
  "odontologia",
  "otro",
];

const ETIQUETA_CATEGORIA: Record<CategoriaServicio, string> = {
  cabello: "Cabello",
  barberia: "Barbería",
  pestañas: "Pestañas",
  uñas: "Uñas",
  costura: "Costura",
  postres: "Postres",
  odontologia: "Odontología",
  otro: "Otros servicios",
};

const ICONO_CATEGORIA: Record<CategoriaServicio, React.ComponentType<{ className?: string }>> = {
  cabello: Scissors,
  barberia: IconoPosteBarbero,
  pestañas: Eye,
  uñas: Sparkles,
  costura: Shirt,
  postres: CakeSlice,
  odontologia: IconoDiente,
  otro: Sparkles,
};

export function SeccionServicios({
  servicios,
  personal,
  idNegocio,
  nombreNegocio,
  urlWhatsapp,
  politicaCancelacion,
}: {
  servicios: Servicio[];
  personal: Personal[];
  idNegocio: string;
  nombreNegocio: string;
  urlWhatsapp: string | null;
  politicaCancelacion: string | null;
}) {
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null);

  function nombreDe(idEmpleado: string | null) {
    if (!idEmpleado) return null;
    return personal.find((p) => p.id === idEmpleado)?.nombre ?? null;
  }

  const categoriasPresentes = ORDEN_CATEGORIAS.filter((cat) =>
    servicios.some((s) => s.categoria === cat),
  );
  // Con una sola categoría (el caso más común, un negocio de un solo rubro)
  // no tiene sentido mostrar un encabezado — se ve igual que antes.
  const agruparPorCategoria = categoriasPresentes.length > 1;

  function grilla(listaServicios: Servicio[]) {
    return (
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {listaServicios.map((servicio) => (
          <TarjetaServicio
            key={servicio.id}
            servicio={servicio}
            nombreEmpleado={nombreDe(servicio.id_empleado)}
            onReservar={() => setServicioSeleccionado(servicio)}
          />
        ))}
      </div>
    );
  }

  return (
    <section id="servicios" className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="font-titulo text-center text-3xl font-semibold text-texto-primario">
        Nuestros servicios
      </h2>

      {servicios.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-2 text-center">
          <Sparkles className="h-7 w-7 text-texto-secundario" strokeWidth={1.5} />
          <p className="text-sm text-texto-secundario">Todavía no hay servicios cargados.</p>
        </div>
      ) : agruparPorCategoria ? (
        categoriasPresentes.map((categoria) => {
          const IconoCategoria = ICONO_CATEGORIA[categoria];
          return (
            <div key={categoria} className="mt-12 first:mt-8">
              <h3 className="flex items-center justify-center gap-2 text-center text-xl font-semibold text-texto-primario">
                <IconoCategoria className="h-5 w-5 text-rosado-texto" />
                {ETIQUETA_CATEGORIA[categoria]}
              </h3>
              {grilla(servicios.filter((s) => s.categoria === categoria))}
            </div>
          );
        })
      ) : (
        grilla(servicios)
      )}

      {servicioSeleccionado && (
        <ModalReserva
          servicio={servicioSeleccionado}
          idNegocio={idNegocio}
          nombreNegocio={nombreNegocio}
          urlWhatsapp={urlWhatsapp}
          politicaCancelacion={politicaCancelacion}
          alCerrar={() => setServicioSeleccionado(null)}
        />
      )}
    </section>
  );
}
