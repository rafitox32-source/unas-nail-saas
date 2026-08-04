import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { enviarNotificaciones, type SuscripcionPush } from "@/lib/enviar-push";

export async function POST(peticion: Request) {
  const { nombreNegocio } = await peticion.json();

  const supabase = await crearClienteServidor();
  const { data } = await supabase.rpc("suscripciones_para_admins");
  const suscripciones = data as SuscripcionPush[] | null;

  if (suscripciones && suscripciones.length > 0) {
    const { endpointsExpirados } = await enviarNotificaciones(suscripciones, {
      titulo: "Nueva cuenta por aprobar",
      cuerpo: nombreNegocio
        ? `${nombreNegocio} se registró y espera tu aprobación.`
        : "Hay una cuenta nueva esperando aprobación.",
      url: "/admin",
    });
    await Promise.all(
      endpointsExpirados.map((endpoint) =>
        supabase.rpc("eliminar_suscripcion_push", { p_endpoint: endpoint }),
      ),
    );
  }

  return NextResponse.json({ ok: true });
}
