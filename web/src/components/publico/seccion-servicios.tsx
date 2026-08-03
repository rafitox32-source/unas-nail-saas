"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { TarjetaServicio } from "@/components/publico/tarjeta-servicio";
import { ModalReserva } from "@/components/publico/modal-reserva";
import type { Servicio } from "@/lib/tipos";

export function SeccionServicios({
  servicios,
  idManicurista,
  nombreNegocio,
  urlWhatsapp,
}: {
  servicios: Servicio[];
  idManicurista: string;
  nombreNegocio: string;
  urlWhatsapp: string | null;
}) {
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null);

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
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {servicios.map((servicio) => (
            <TarjetaServicio
              key={servicio.id}
              servicio={servicio}
              onReservar={() => setServicioSeleccionado(servicio)}
            />
          ))}
        </div>
      )}

      {servicioSeleccionado && (
        <ModalReserva
          servicio={servicioSeleccionado}
          idManicurista={idManicurista}
          nombreNegocio={nombreNegocio}
          urlWhatsapp={urlWhatsapp}
          alCerrar={() => setServicioSeleccionado(null)}
        />
      )}
    </section>
  );
}
