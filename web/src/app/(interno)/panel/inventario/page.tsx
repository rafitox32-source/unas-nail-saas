import { crearClienteServidor } from "@/lib/supabase/servidor";
import { GestionInventario } from "@/components/interno/gestion-inventario";
import type { InsumoInventario } from "@/lib/tipos";

export default async function PaginaInventario() {
  const supabase = await crearClienteServidor();
  const {
    data: { user: usuario },
  } = await supabase.auth.getUser();

  const { data: insumos } = await supabase
    .from("inventario")
    .select("id, nombre_insumo, categoria, cantidad_actual, unidad_medida, cantidad_minima_alerta, costo_unitario")
    .eq("id_negocio", usuario!.id)
    .order("nombre_insumo", { ascending: true })
    .returns<InsumoInventario[]>();

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-10">
      <GestionInventario idNegocio={usuario!.id} insumosIniciales={insumos ?? []} />
    </main>
  );
}
