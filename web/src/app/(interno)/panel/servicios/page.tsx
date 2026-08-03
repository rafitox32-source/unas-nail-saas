import { crearClienteServidor } from "@/lib/supabase/servidor";
import { GestionServicios } from "@/components/interno/gestion-servicios";
import { GestionGaleria } from "@/components/interno/gestion-galeria";
import type { ServicioAdmin, FotoGaleria, FotoGaleriaAdmin } from "@/lib/tipos";

export default async function PaginaServicios() {
  const supabase = await crearClienteServidor();
  const {
    data: { user: usuario },
  } = await supabase.auth.getUser();

  const { data: servicios } = await supabase
    .from("servicios")
    .select("id, nombre, descripcion, precio, duracion_minutos, monto_seña, activo")
    .eq("id_manicurista", usuario!.id)
    .order("creado_en", { ascending: true })
    .returns<ServicioAdmin[]>();

  const { data: fotos } = await supabase
    .from("fotos_galeria")
    .select("id, ruta_archivo, orden")
    .eq("id_manicurista", usuario!.id)
    .order("orden", { ascending: true })
    .returns<FotoGaleria[]>();

  const fotosConUrl: FotoGaleriaAdmin[] = (fotos ?? []).map((foto) => ({
    ...foto,
    url: supabase.storage.from("fotos-galeria").getPublicUrl(foto.ruta_archivo).data.publicUrl,
  }));

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-10">
      <GestionServicios idManicurista={usuario!.id} serviciosIniciales={servicios ?? []} />
      <GestionGaleria idManicurista={usuario!.id} fotosIniciales={fotosConUrl} />
    </main>
  );
}
