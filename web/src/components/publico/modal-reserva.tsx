"use client";

import { useEffect, useState } from "react";
import { X, User, Phone, Tag, Loader2, CheckCircle2, MessageCircle, Clock } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { CampoConIcono } from "@/components/campo-con-icono";
import { CalendarioDisponibilidad } from "@/components/publico/calendario-disponibilidad";
import { formateadorPrecio } from "@/lib/formato";
import { generarHorariosDisponibles, hoyISO } from "@/lib/disponibilidad";
import type { Servicio, RangoOcupado } from "@/lib/tipos";

export function ModalReserva({
  servicio,
  idManicurista,
  nombreNegocio,
  urlWhatsapp,
  alCerrar,
}: {
  servicio: Servicio;
  idManicurista: string;
  nombreNegocio: string;
  urlWhatsapp: string | null;
  alCerrar: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [hora, setHora] = useState("");
  const [horariosOcupados, setHorariosOcupados] = useState<RangoOcupado[]>([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [codigoPromocional, setCodigoPromocional] = useState("");
  const [promoValidada, setPromoValidada] = useState<{
    tipo_descuento: "porcentaje" | "monto_fijo";
    valor_descuento: number;
  } | null>(null);
  const [promoInvalida, setPromoInvalida] = useState(false);
  const [validandoPromo, setValidandoPromo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{
    monto_seña: number;
    monto_total: number;
    descuento_aplicado: number;
  } | null>(null);

  useEffect(() => {
    if (!fecha) return;
    let cancelado = false;
    const supabase = crearClienteNavegador();
    setCargandoHorarios(true);
    setHora("");
    supabase
      .rpc("horarios_ocupados", { p_id_manicurista: idManicurista, p_fecha: fecha })
      .then(({ data }) => {
        if (cancelado) return;
        setHorariosOcupados(data ?? []);
        setCargandoHorarios(false);
      });
    return () => {
      cancelado = true;
    };
  }, [fecha, idManicurista]);

  useEffect(() => {
    const codigo = codigoPromocional.trim();
    if (!codigo) {
      setPromoValidada(null);
      setPromoInvalida(false);
      return;
    }
    let cancelado = false;
    const supabase = crearClienteNavegador();
    setValidandoPromo(true);
    const temporizador = setTimeout(() => {
      supabase
        .rpc("validar_codigo_promocional", { p_id_manicurista: idManicurista, p_codigo: codigo })
        .maybeSingle()
        .then(({ data, error: errorRpc }) => {
          if (cancelado) return;
          setValidandoPromo(false);
          if (errorRpc || !data) {
            setPromoValidada(null);
            setPromoInvalida(true);
          } else {
            setPromoValidada(data as { tipo_descuento: "porcentaje" | "monto_fijo"; valor_descuento: number });
            setPromoInvalida(false);
          }
        });
    }, 500);
    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [codigoPromocional, idManicurista]);

  const horariosDisponibles = generarHorariosDisponibles(
    fecha,
    servicio.duracion_minutos,
    horariosOcupados,
  );

  const precioConDescuento = (() => {
    if (!promoValidada) return null;
    const descuento =
      promoValidada.tipo_descuento === "porcentaje"
        ? (servicio.precio * promoValidada.valor_descuento) / 100
        : promoValidada.valor_descuento;
    return Math.max(0, servicio.precio - Math.min(descuento, servicio.precio));
  })();

  async function alEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);

    if (!hora) {
      setError("Elegí un horario.");
      return;
    }

    const fechaHoraInicio = new Date(`${fecha}T${hora}:00`);
    setEnviando(true);

    const supabase = crearClienteNavegador();
    const { data, error: errorRpc } = await supabase
      .rpc("crear_apartado", {
        p_id_manicurista: idManicurista,
        p_id_servicio: servicio.id,
        p_nombre_clienta: nombre,
        p_telefono_clienta: telefono,
        p_fecha_hora_inicio: fechaHoraInicio.toISOString(),
        p_codigo_promocional: codigoPromocional.trim() || null,
      })
      .single();

    setEnviando(false);

    if (errorRpc) {
      setError(errorRpc.message.replace(/^.*?:\s*/, ""));
      return;
    }

    setResultado(data as { monto_seña: number; monto_total: number; descuento_aplicado: number });
  }

  const urlWhatsappConfirmacion =
    resultado && urlWhatsapp
      ? `${urlWhatsapp}%0AServicio: ${encodeURIComponent(servicio.nombre)}%0AFecha: ${fecha} ${hora}%0AAdjunto el comprobante de la seña (${formateadorPrecio.format(resultado.monto_seña)}).`
      : urlWhatsapp;

  return (
    <div
      className="animar-fondo-modal fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
      onClick={alCerrar}
    >
      <div
        className="animar-hoja-modal w-full max-w-md rounded-t-3xl bg-superficie p-6 shadow-2xl sm:animar-tarjeta-modal sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {resultado ? (
          <div className="animar-aparecer text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-exito" strokeWidth={1.5} />
            <h3 className="font-titulo mt-3 text-2xl font-semibold text-texto-primario">
              ¡Cita reservada!
            </h3>
            {resultado.descuento_aplicado > 0 && (
              <p className="mt-2 text-sm font-semibold text-exito">
                Código aplicado: −{formateadorPrecio.format(resultado.descuento_aplicado)} · Nuevo
                total {formateadorPrecio.format(resultado.monto_total)}
              </p>
            )}
            <p className="mt-3 text-sm text-texto-secundario">
              {resultado.monto_seña > 0 ? (
                <>
                  Quedó pendiente de confirmar la seña de{" "}
                  <strong className="text-texto-primario">
                    {formateadorPrecio.format(resultado.monto_seña)}
                  </strong>
                  . Mandá el comprobante para confirmarla.
                </>
              ) : (
                "Este servicio no requiere seña. ¡Te esperamos!"
              )}
            </p>
            {urlWhatsappConfirmacion && (
              <a
                href={urlWhatsappConfirmacion}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-rosado py-3 text-sm font-semibold uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5"
              >
                <MessageCircle className="h-4 w-4" />
                Enviar comprobante por WhatsApp
              </a>
            )}
            <button
              type="button"
              onClick={alCerrar}
              className="mt-3 w-full py-2 text-sm text-texto-secundario"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-titulo text-xl font-semibold text-texto-primario">
                  {servicio.nombre}
                </h3>
                <p className="text-sm text-texto-secundario">{nombreNegocio}</p>
              </div>
              <button
                type="button"
                onClick={alCerrar}
                aria-label="Cerrar"
                className="shrink-0 rounded-full p-1 text-texto-secundario transition-colors hover:bg-borde/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={alEnviar} className="flex flex-col gap-3">
              <label className="text-sm text-texto-secundario">
                Tu nombre
                <CampoConIcono
                  icono={User}
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </label>
              <label className="text-sm text-texto-secundario">
                Teléfono (WhatsApp)
                <CampoConIcono
                  icono={Phone}
                  required
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </label>
              <div>
                <p className="text-sm text-texto-secundario">Elegí el día</p>
                <div className="mt-1 rounded-xl border border-borde bg-fondo p-3">
                  <CalendarioDisponibilidad
                    idManicurista={idManicurista}
                    duracionMinutos={servicio.duracion_minutos}
                    fechaSeleccionada={fecha}
                    onSeleccionar={setFecha}
                  />
                </div>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-sm text-texto-secundario">
                  <Clock className="h-3.5 w-3.5" /> Horario disponible
                </p>
                {cargandoHorarios ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-texto-secundario">
                    <Loader2 className="h-3 w-3 animate-spin" /> Consultando disponibilidad…
                  </p>
                ) : horariosDisponibles.length === 0 ? (
                  <p className="mt-2 text-xs text-alerta">
                    No quedan turnos disponibles ese día, probá con otra fecha.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {horariosDisponibles.map((horaDisponible) => (
                      <button
                        key={horaDisponible}
                        type="button"
                        onClick={() => setHora(horaDisponible)}
                        className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                          hora === horaDisponible
                            ? "border-rosado bg-rosado text-white"
                            : "border-borde bg-fondo text-texto-primario hover:border-rosado"
                        }`}
                      >
                        {horaDisponible}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <label className="text-sm text-texto-secundario">
                Código promocional (opcional)
                <CampoConIcono
                  icono={Tag}
                  value={codigoPromocional}
                  onChange={(e) => setCodigoPromocional(e.target.value.toUpperCase())}
                  placeholder="Ej: VERANO2026"
                  className="uppercase"
                />
              </label>
              {validandoPromo && (
                <p className="flex items-center gap-1.5 text-xs text-texto-secundario">
                  <Loader2 className="h-3 w-3 animate-spin" /> Validando código…
                </p>
              )}
              {!validandoPromo && promoValidada && precioConDescuento !== null && (
                <p className="animar-aparecer flex items-center gap-1.5 text-xs font-semibold text-exito">
                  <CheckCircle2 className="h-3.5 w-3.5" /> ¡Código válido! Precio con descuento:{" "}
                  {formateadorPrecio.format(precioConDescuento)}
                </p>
              )}
              {!validandoPromo && promoInvalida && (
                <p className="animar-aparecer text-xs text-alerta">
                  Ese código no es válido o ya venció.
                </p>
              )}

              {error && <p className="animar-aparecer text-sm text-alerta">{error}</p>}

              <button
                type="submit"
                disabled={enviando}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-rosado py-3 text-sm font-semibold uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                {enviando ? "Reservando…" : "Confirmar reserva"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
