import { notFound } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { FichaClienta } from "@/components/interno/ficha-clienta";
import type {
  ClientaAdmin,
  CitaHistorial,
  NotaVisita,
  FotoFirmada,
  ProgramaLealtad,
} from "@/lib/tipos";

export default async function PaginaClienta({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const {
    data: { user: usuario },
  } = await supabase.auth.getUser();

  const { data: clienta } = await supabase
    .from("clientas")
    .select(
      "id, nombre_completo, telefono, email, alergias, notas_internas, valor_vida_cliente, visitas_completadas, premios_canjeados",
    )
    .eq("id", id)
    .maybeSingle<ClientaAdmin>();

  if (!clienta) notFound();

  const { data: lealtad } = await supabase
    .from("usuarios_manicuristas")
    .select("lealtad_activo, lealtad_visitas_objetivo, lealtad_premio_descripcion")
    .eq("id", usuario!.id)
    .maybeSingle<ProgramaLealtad>();

  const { data: historial } = await supabase
    .from("citas_apartados")
    .select("id, fecha_hora_inicio, estado_cita, monto_total, servicios(nombre)")
    .eq("id_clienta", id)
    .order("fecha_hora_inicio", { ascending: false })
    .returns<CitaHistorial[]>();

  const idsCitas = (historial ?? []).map((cita) => cita.id);

  const { data: notas } = idsCitas.length
    ? await supabase
        .from("notas_visita")
        .select("id, id_cita, formula_color, notas, rutas_fotos")
        .in("id_cita", idsCitas)
        .returns<NotaVisita[]>()
    : { data: [] as NotaVisita[] };

  const todasLasRutas = (notas ?? []).flatMap((n) => n.rutas_fotos);
  const { data: firmadas } = todasLasRutas.length
    ? await supabase.storage.from("fotos-clientas").createSignedUrls(todasLasRutas, 3600)
    : { data: [] };

  const urlPorRuta = new Map((firmadas ?? []).map((f) => [f.path, f.signedUrl]));

  const notasPorCita: Record<string, { nota: NotaVisita | null; fotos: FotoFirmada[] }> = {};
  for (const nota of notas ?? []) {
    notasPorCita[nota.id_cita] = {
      nota,
      fotos: nota.rutas_fotos
        .map((ruta) => ({ ruta, url: urlPorRuta.get(ruta) ?? "" }))
        .filter((f) => f.url),
    };
  }

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-10">
      <FichaClienta
        clienta={clienta}
        idManicurista={usuario!.id}
        historial={historial ?? []}
        notasPorCita={notasPorCita}
        lealtad={
          lealtad ?? {
            lealtad_activo: false,
            lealtad_visitas_objetivo: null,
            lealtad_premio_descripcion: null,
          }
        }
      />
    </main>
  );
}
