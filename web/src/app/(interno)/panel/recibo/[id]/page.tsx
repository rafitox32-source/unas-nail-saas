import { notFound } from "next/navigation";
import { CheckCircle2, MessageCircle, Flower } from "lucide-react";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { BotonImprimir } from "@/components/interno/boton-imprimir";
import { formateadorPrecio } from "@/lib/formato";
import type { ReciboDatos } from "@/lib/tipos";

const formateadorFecha = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default async function PaginaRecibo({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await crearClienteServidor();

  const { data: cita } = await supabase
    .from("citas_apartados")
    .select(
      "id, fecha_hora_inicio, monto_total, monto_seña_pagado, clientas(nombre_completo, telefono), servicios(nombre), usuarios_negocios(nombre_negocio, telefono)",
    )
    .eq("id", id)
    .maybeSingle<ReciboDatos>();

  if (!cita) notFound();

  const negocio = cita.usuarios_negocios;
  const enlaceWhatsapp = cita.clientas?.telefono
    ? `https://wa.me/${cita.clientas.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hola ${cita.clientas.nombre_completo}! Te paso el recibo de tu visita a ${negocio?.nombre_negocio ?? ""}.`,
      )}`
    : null;

  return (
    <main className="animar-aparecer mx-auto max-w-md flex-1 px-6 py-10">
      <div className="rounded-2xl border border-borde bg-superficie p-8 shadow-sm print:border-none print:p-0 print:shadow-none">
        <div className="text-center">
          <Flower className="mx-auto h-6 w-6 text-rosado-texto" strokeWidth={1.5} />
          <h1 className="font-titulo mt-2 text-2xl font-semibold text-texto-primario">
            {negocio?.nombre_negocio ?? "Recibo"}
          </h1>
          {negocio?.telefono && (
            <p className="mt-1 text-xs text-texto-secundario">{negocio.telefono}</p>
          )}
        </div>

        <div className="mt-6 border-t border-dashed border-borde pt-6">
          <p className="text-xs uppercase tracking-wide text-texto-secundario">Cliente</p>
          <p className="text-sm font-semibold text-texto-primario">
            {cita.clientas?.nombre_completo}
          </p>

          <p className="mt-4 text-xs uppercase tracking-wide text-texto-secundario">
            Fecha del servicio
          </p>
          <p className="text-sm text-texto-primario">
            {formateadorFecha.format(new Date(cita.fecha_hora_inicio))}
          </p>
        </div>

        <div className="mt-6 border-t border-dashed border-borde pt-6">
          <div className="flex items-start justify-between gap-3 text-sm">
            <span className="text-texto-primario">{cita.servicios?.nombre}</span>
            <span className="shrink-0 text-texto-primario">
              {formateadorPrecio.format(cita.monto_total)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-borde pt-3 font-semibold">
            <span className="text-texto-primario">Total pagado</span>
            <span className="shrink-0 text-dorado">
              {formateadorPrecio.format(cita.monto_seña_pagado)}
            </span>
          </div>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 rounded-full bg-exito-suave py-2 text-center text-xs font-semibold text-exito">
          <CheckCircle2 className="h-4 w-4" />
          Pagado en su totalidad
        </p>

        <p className="mt-8 text-center text-xs text-texto-secundario">
          Gracias por tu visita ✦
        </p>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 print:hidden">
        <BotonImprimir />
        {enlaceWhatsapp && (
          <a
            href={enlaceWhatsapp}
            className="flex items-center gap-1.5 text-sm font-semibold text-rosado-texto hover:underline"
          >
            <MessageCircle className="h-4 w-4" />
            Enviar por WhatsApp →
          </a>
        )}
      </div>
    </main>
  );
}
