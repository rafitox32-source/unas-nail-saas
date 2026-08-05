import { crearClienteServidor } from "@/lib/supabase/servidor";
import { GestionAgenda } from "@/components/interno/gestion-agenda";
import { GestionBloqueos } from "@/components/interno/gestion-bloqueos";
import type { CitaAgenda, BloqueoAgenda, Personal } from "@/lib/tipos";

export default async function PaginaAgenda() {
  const supabase = await crearClienteServidor();
  const {
    data: { user: usuario },
  } = await supabase.auth.getUser();

  const { data: personal } = await supabase
    .from("personal")
    .select("id, nombre, categoria, url_foto, activo")
    .eq("id_negocio", usuario!.id)
    .order("creado_en", { ascending: true })
    .returns<Personal[]>();

  const { data: citas } = await supabase
    .from("citas_apartados")
    .select(
      "id, fecha_hora_inicio, estado_cita, monto_total, monto_seña_pagado, monto_restante, id_empleado, metodo_pago, notas_clienta, clientas(nombre_completo, telefono), servicios(nombre), personal(nombre)",
    )
    .eq("id_negocio", usuario!.id)
    .order("fecha_hora_inicio", { ascending: true })
    .returns<CitaAgenda[]>();

  const { data: bloqueos } = await supabase
    .from("bloqueos_agenda")
    .select("id, fecha_hora_inicio, fecha_hora_fin, motivo, id_empleado")
    .eq("id_negocio", usuario!.id)
    .gte("fecha_hora_fin", new Date().toISOString())
    .order("fecha_hora_inicio", { ascending: true })
    .returns<BloqueoAgenda[]>();

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-10">
      <GestionAgenda citasIniciales={citas ?? []} personal={personal ?? []} />
      <GestionBloqueos
        idNegocio={usuario!.id}
        bloqueosIniciales={bloqueos ?? []}
        personal={personal ?? []}
      />
    </main>
  );
}
