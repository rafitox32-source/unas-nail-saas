import { Sparkles, Clock, User } from "lucide-react";
import { formateadorPrecio } from "@/lib/formato";
import type { Servicio } from "@/lib/tipos";

export function TarjetaServicio({
  servicio,
  nombreEmpleado,
  onReservar,
}: {
  servicio: Servicio;
  nombreEmpleado?: string | null;
  onReservar: () => void;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-[20px] border border-borde bg-superficie shadow-[0_10px_30px_rgba(54,42,39,0.06)] transition-all hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(54,42,39,0.12)]">
      <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-rosado-suave to-nude">
        {servicio.url_foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={servicio.url_foto}
            alt={servicio.nombre}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Sparkles
            className="h-10 w-10 text-white/50 transition-transform duration-300 group-hover:scale-110"
            strokeWidth={1.25}
          />
        )}
        {servicio.monto_seña > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-superficie/90 px-2.5 py-1 text-xs font-semibold text-texto-primario">
            Abono {formateadorPrecio.format(servicio.monto_seña)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <h3 className="font-titulo text-lg font-semibold text-texto-primario">
          {servicio.nombre}
        </h3>
        {servicio.descripcion && (
          <p className="mt-1.5 text-sm leading-relaxed text-texto-secundario">
            {servicio.descripcion}
          </p>
        )}
        {nombreEmpleado && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-rosado-texto">
            <User className="h-3 w-3" />
            {nombreEmpleado}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xl font-semibold text-texto-primario">
            {formateadorPrecio.format(servicio.precio)}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs text-texto-secundario">
            <Clock className="h-3.5 w-3.5" />
            {servicio.duracion_minutos} min
          </span>
        </div>
        <button
          type="button"
          onClick={onReservar}
          className="mt-4 rounded-full bg-rosado py-3 text-center text-xs font-semibold uppercase tracking-wide text-white shadow-[0_6px_16px_rgba(147,80,96,0.4)] transition-transform hover:-translate-y-0.5"
        >
          Reservar
        </button>
      </div>
    </div>
  );
}
