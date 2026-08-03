import { crearClienteServidor } from "@/lib/supabase/servidor";
import { GestionAgenda } from "@/components/interno/gestion-agenda";
import type { CitaAgenda } from "@/lib/tipos";

export default async function PaginaAgenda() {
  const supabase = await crearClienteServidor();
  const {
    data: { user: usuario },
  } = await supabase.auth.getUser();

  const { data: citas } = await supabase
    .from("citas_apartados")
    .select(
      "id, fecha_hora_inicio, estado_cita, monto_total, monto_seña_pagado, monto_restante, clientas(nombre_completo, telefono), servicios(nombre)",
    )
    .eq("id_manicurista", usuario!.id)
    .order("fecha_hora_inicio", { ascending: true })
    .returns<CitaAgenda[]>();

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-10">
      <GestionAgenda citasIniciales={citas ?? []} />
    </main>
  );
}
