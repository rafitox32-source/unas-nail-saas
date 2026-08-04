import { crearClienteServidor } from "@/lib/supabase/servidor";
import { GestionPromociones } from "@/components/interno/gestion-promociones";
import { ConfiguracionLealtad } from "@/components/interno/configuracion-lealtad";
import { GestionResenas } from "@/components/interno/gestion-resenas";
import { GeneradorEstados } from "@/components/interno/generador-estados";
import type { PromocionAdmin, ProgramaLealtad, ResenaAdmin } from "@/lib/tipos";

export default async function PaginaPromociones() {
  const supabase = await crearClienteServidor();
  const {
    data: { user: usuario },
  } = await supabase.auth.getUser();

  const { data: promociones } = await supabase
    .from("promociones")
    .select(
      "id, codigo, descripcion, tipo_descuento, valor_descuento, fecha_inicio, fecha_expiracion, usos_maximos, usos_actuales, activo",
    )
    .eq("id_manicurista", usuario!.id)
    .order("creado_en", { ascending: false })
    .returns<PromocionAdmin[]>();

  const { data: lealtad } = await supabase
    .from("usuarios_manicuristas")
    .select("lealtad_activo, lealtad_visitas_objetivo, lealtad_premio_descripcion")
    .eq("id", usuario!.id)
    .maybeSingle<ProgramaLealtad>();

  const { data: resenas } = await supabase
    .from("resenas")
    .select("id, nombre_clienta, calificacion, comentario, visible")
    .eq("id_manicurista", usuario!.id)
    .order("creado_en", { ascending: false })
    .returns<ResenaAdmin[]>();

  const { data: negocio } = await supabase
    .from("usuarios_manicuristas")
    .select("nombre_negocio, color_marca, url_avatar, slug_publico")
    .eq("id", usuario!.id)
    .maybeSingle<{
      nombre_negocio: string;
      color_marca: string | null;
      url_avatar: string | null;
      slug_publico: string | null;
    }>();

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-10">
      <GestionPromociones idManicurista={usuario!.id} promocionesIniciales={promociones ?? []} />
      <ConfiguracionLealtad
        idManicurista={usuario!.id}
        configuracionInicial={
          lealtad ?? {
            lealtad_activo: false,
            lealtad_visitas_objetivo: null,
            lealtad_premio_descripcion: null,
          }
        }
      />
      <GestionResenas idManicurista={usuario!.id} resenasIniciales={resenas ?? []} />
      {negocio && (
        <GeneradorEstados
          nombreNegocio={negocio.nombre_negocio}
          colorMarca={negocio.color_marca}
          urlAvatar={negocio.url_avatar}
          slugPublico={negocio.slug_publico}
        />
      )}
    </main>
  );
}
