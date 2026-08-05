import { crearClienteServidor } from "@/lib/supabase/servidor";
import { GestionPersonal } from "@/components/interno/gestion-personal";
import { GestionServicios } from "@/components/interno/gestion-servicios";
import { GestionGaleria } from "@/components/interno/gestion-galeria";
import type { ServicioAdmin, FotoGaleria, FotoGaleriaAdmin, Personal, TipoNegocio } from "@/lib/tipos";

export default async function PaginaServicios() {
  const supabase = await crearClienteServidor();
  const {
    data: { user: usuario },
  } = await supabase.auth.getUser();

  const { data: cuenta } = await supabase
    .from("usuarios_negocios")
    .select("tipo_negocio")
    .eq("id", usuario!.id)
    .maybeSingle<{ tipo_negocio: TipoNegocio }>();

  const { data: personal } = await supabase
    .from("personal")
    .select("id, nombre, categoria, url_foto, activo")
    .eq("id_negocio", usuario!.id)
    .order("creado_en", { ascending: true })
    .returns<Personal[]>();

  const { data: servicios } = await supabase
    .from("servicios")
    .select("id, nombre, descripcion, precio, duracion_minutos, monto_seña, categoria, id_empleado, url_foto, dias_para_retoque, es_por_encargo, activo")
    .eq("id_negocio", usuario!.id)
    .order("creado_en", { ascending: true })
    .returns<ServicioAdmin[]>();

  const { data: fotos } = await supabase
    .from("fotos_galeria")
    .select("id, ruta_archivo, orden")
    .eq("id_negocio", usuario!.id)
    .order("orden", { ascending: true })
    .returns<FotoGaleria[]>();

  const fotosConUrl: FotoGaleriaAdmin[] = (fotos ?? []).map((foto) => ({
    ...foto,
    url: supabase.storage.from("fotos-galeria").getPublicUrl(foto.ruta_archivo).data.publicUrl,
  }));

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-10">
      <GestionPersonal idNegocio={usuario!.id} personalInicial={personal ?? []} />
      <div className="mt-8 border-t border-borde pt-8">
        <GestionServicios
          idNegocio={usuario!.id}
          serviciosIniciales={servicios ?? []}
          personal={personal ?? []}
          tipoNegocio={cuenta?.tipo_negocio ?? "uñas"}
        />
      </div>
      <GestionGaleria idNegocio={usuario!.id} fotosIniciales={fotosConUrl} />
    </main>
  );
}
