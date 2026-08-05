import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { enviarNotificaciones, type SuscripcionPush } from "@/lib/enviar-push";

export async function POST(peticion: Request) {
  const { idNegocio, nombreClienta, nombreServicio } = await peticion.json();
  if (!idNegocio) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = await crearClienteServidor();
  const { data } = await supabase.rpc("suscripciones_para_negocio", {
    p_id_negocio: idNegocio,
  });
  const suscripciones = data as SuscripcionPush[] | null;

  if (suscripciones && suscripciones.length > 0) {
    const { endpointsExpirados } = await enviarNotificaciones(suscripciones, {
      titulo: "Nueva reserva",
      cuerpo: `${nombreClienta ?? "Una clienta"} reservó ${nombreServicio ?? "un turno"}.`,
      url: "/panel/agenda",
    });
    await Promise.all(
      endpointsExpirados.map((endpoint) =>
        supabase.rpc("eliminar_suscripcion_push", { p_endpoint: endpoint }),
      ),
    );
  }

  return NextResponse.json({ ok: true });
}
