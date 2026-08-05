"use client";

import { useEffect, useRef, useState } from "react";
import { X, User, Phone, Tag, Loader2, CheckCircle2, MessageCircle, Clock, Info, Wallet } from "lucide-react";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { CampoConIcono } from "@/components/campo-con-icono";
import { CalendarioDisponibilidad } from "@/components/publico/calendario-disponibilidad";
import { formateadorPrecio } from "@/lib/formato";
import { generarHorariosDisponibles, hoyISO } from "@/lib/disponibilidad";
import { ETIQUETA_METODO_PAGO, ICONO_METODO_PAGO, CLASES_METODO_PAGO } from "@/lib/metodo-pago";
import type { Servicio, RangoOcupado, MetodoPago } from "@/lib/tipos";

const METODOS_PAGO: MetodoPago[] = ["yape", "plin", "efectivo"];

export function ModalReserva({
  servicio,
  idNegocio,
  nombreNegocio,
  urlWhatsapp,
  politicaCancelacion,
  alCerrar,
}: {
  servicio: Servicio;
  idNegocio: string;
  nombreNegocio: string;
  urlWhatsapp: string | null;
  politicaCancelacion: string | null;
  alCerrar: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [metodoPago, setMetodoPago] = useState<MetodoPago | "">("");
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
  const [seccionConError, setSeccionConError] = useState<"hora" | "metodoPago" | null>(null);
  const refHorario = useRef<HTMLDivElement>(null);
  const refMetodoPago = useRef<HTMLDivElement>(null);
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
      .rpc("horarios_ocupados", {
        p_id_negocio: idNegocio,
        p_fecha: fecha,
        p_id_empleado: servicio.id_empleado,
      })
      .then(({ data }) => {
        if (cancelado) return;
        setHorariosOcupados(data ?? []);
        setCargandoHorarios(false);
      });
    return () => {
      cancelado = true;
    };
  }, [fecha, idNegocio, servicio.id_empleado]);

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
        .rpc("validar_codigo_promocional", { p_id_negocio: idNegocio, p_codigo: codigo })
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
  }, [codigoPromocional, idNegocio]);

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

  function irAError(seccion: "hora" | "metodoPago", mensaje: string) {
    setError(mensaje);
    setSeccionConError(seccion);
    const ref = seccion === "hora" ? refHorario : refMetodoPago;
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function alEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);

    if (!hora) {
      irAError("hora", "Te faltó elegir un horario — mirá arriba ↑");
      return;
    }

    if (!metodoPago) {
      irAError("metodoPago", "Te faltó elegir cómo vas a pagar — mirá arriba ↑");
      return;
    }

    const fechaHoraInicio = new Date(`${fecha}T${hora}:00`);
    setEnviando(true);

    const supabase = crearClienteNavegador();
    const { data, error: errorRpc } = await supabase
      .rpc("crear_apartado", {
        p_id_negocio: idNegocio,
        p_id_servicio: servicio.id,
        p_nombre_clienta: nombre,
        p_telefono_clienta: telefono,
        p_fecha_hora_inicio: fechaHoraInicio.toISOString(),
        p_codigo_promocional: codigoPromocional.trim() || null,
        p_metodo_pago: metodoPago,
      })
      .single();

    setEnviando(false);

    if (errorRpc) {
      setError(errorRpc.message.replace(/^.*?:\s*/, ""));
      return;
    }

    setResultado(data as { monto_seña: number; monto_total: number; descuento_aplicado: number });

    fetch("/api/notificaciones/nueva-reserva", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idNegocio,
        nombreClienta: nombre,
        nombreServicio: servicio.nombre,
      }),
    }).catch(() => {});
  }

  const esEfectivo = metodoPago === "efectivo";
  const requiereComprobante = resultado != null && resultado.monto_seña > 0 && !esEfectivo;

  const urlWhatsappConfirmacion =
    resultado && urlWhatsapp
      ? requiereComprobante
        ? `${urlWhatsapp}%0AServicio: ${encodeURIComponent(servicio.nombre)}%0AFecha: ${fecha} ${hora}%0AAdjunto el comprobante del abono (${formateadorPrecio.format(resultado.monto_seña)}).`
        : `${urlWhatsapp}%0AServicio: ${encodeURIComponent(servicio.nombre)}%0AFecha: ${fecha} ${hora}%0AConfirmo mi cita${esEfectivo ? ", pago en efectivo" : ""}.`
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
                esEfectivo ? (
                  <>
                    Vas a abonar{" "}
                    <strong className="text-texto-primario">
                      {formateadorPrecio.format(resultado.monto_seña)}
                    </strong>{" "}
                    en efectivo. ¡Te esperamos!
                  </>
                ) : (
                  <>
                    Quedó pendiente de confirmar el abono de{" "}
                    <strong className="text-texto-primario">
                      {formateadorPrecio.format(resultado.monto_seña)}
                    </strong>{" "}
                    por {ETIQUETA_METODO_PAGO[metodoPago as MetodoPago]}. Mandá el comprobante para
                    confirmarlo.
                  </>
                )
              ) : (
                "Este servicio no requiere abono. ¡Te esperamos!"
              )}
            </p>
            {urlWhatsappConfirmacion && (
              <a
                href={urlWhatsappConfirmacion}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-rosado py-3 text-sm font-semibold uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5"
              >
                <MessageCircle className="h-4 w-4" />
                {requiereComprobante ? "Enviar comprobante por WhatsApp" : "Avisar por WhatsApp"}
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
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-texto-primario">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rosado text-[11px] font-bold text-white">
                    1
                  </span>
                  Tus datos
                </p>
                <div className="mt-2 flex flex-col gap-3 pl-7">
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
                </div>
              </div>

              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-texto-primario">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rosado text-[11px] font-bold text-white">
                    2
                  </span>
                  Elegí el día
                </p>
                <div className="mt-2 rounded-xl border border-borde bg-fondo p-3 pl-3">
                  <CalendarioDisponibilidad
                    idNegocio={idNegocio}
                    idEmpleado={servicio.id_empleado}
                    duracionMinutos={servicio.duracion_minutos}
                    fechaSeleccionada={fecha}
                    onSeleccionar={setFecha}
                  />
                </div>
              </div>

              <div
                ref={refHorario}
                className={`rounded-xl transition-shadow ${
                  seccionConError === "hora" ? "animar-aparecer ring-2 ring-alerta ring-offset-2" : ""
                }`}
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-texto-primario">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rosado text-[11px] font-bold text-white">
                    3
                  </span>
                  <Clock className="h-3.5 w-3.5 text-texto-secundario" /> Elegí el horario
                </p>
                <div className="pl-7">
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
                          onClick={() => {
                            setHora(horaDisponible);
                            setSeccionConError(null);
                          }}
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
              </div>

              <div
                ref={refMetodoPago}
                className={`rounded-xl transition-shadow ${
                  seccionConError === "metodoPago" ? "animar-aparecer ring-2 ring-alerta ring-offset-2" : ""
                }`}
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-texto-primario">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rosado text-[11px] font-bold text-white">
                    4
                  </span>
                  <Wallet className="h-3.5 w-3.5 text-texto-secundario" /> ¿Cómo vas a pagar?
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 pl-7">
                  {METODOS_PAGO.map((metodo) => {
                    const Icono = ICONO_METODO_PAGO[metodo];
                    const clases = CLASES_METODO_PAGO[metodo];
                    const seleccionado = metodoPago === metodo;
                    return (
                      <button
                        key={metodo}
                        type="button"
                        onClick={() => {
                          setMetodoPago(metodo);
                          setSeccionConError(null);
                        }}
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 py-2.5 text-xs font-semibold transition-colors ${
                          seleccionado
                            ? `${clases.borde} ${clases.fondoSuave} ${clases.texto}`
                            : "border-borde bg-fondo text-texto-secundario hover:border-texto-secundario"
                        }`}
                      >
                        <Icono className="h-4 w-4" />
                        {ETIQUETA_METODO_PAGO[metodo]}
                      </button>
                    );
                  })}
                </div>
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

              {politicaCancelacion && (
                <p className="flex items-start gap-1.5 rounded-xl bg-dorado-suave px-3 py-2.5 text-xs text-texto-primario">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dorado" />
                  {politicaCancelacion}
                </p>
              )}

              {error && (
                <p className="animar-aparecer flex items-center gap-1.5 rounded-xl bg-alerta-suave px-3 py-2.5 text-sm font-semibold text-alerta">
                  <Info className="h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

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
