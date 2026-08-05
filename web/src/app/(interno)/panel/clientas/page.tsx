import { crearClienteServidor } from "@/lib/supabase/servidor";
import { ListaClientas } from "@/components/interno/lista-clientas";
import type { ClientaAdmin } from "@/lib/tipos";

export default async function PaginaClientas() {
  const supabase = await crearClienteServidor();
  const {
    data: { user: usuario },
  } = await supabase.auth.getUser();

  const { data: clientas } = await supabase
    .from("clientas")
    .select("id, nombre_completo, telefono, email, alergias, notas_internas, valor_vida_cliente")
    .eq("id_negocio", usuario!.id)
    .order("nombre_completo", { ascending: true })
    .returns<ClientaAdmin[]>();

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-10">
      <ListaClientas clientas={clientas ?? []} idNegocio={usuario!.id} />
    </main>
  );
}
