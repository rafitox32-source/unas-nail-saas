import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { BotonCerrarSesion } from "@/components/interno/cerrar-sesion";
import { GestionCuentas } from "@/components/admin/gestion-cuentas";
import type { SesionNegocio, CuentaAdmin } from "@/lib/tipos";

export default async function PaginaAdmin() {
  const supabase = await crearClienteServidor();
  const {
    data: { user: usuario },
  } = await supabase.auth.getUser();

  if (!usuario) redirect("/ingresar");

  const { data: sesion } = await supabase
    .from("usuarios_negocios")
    .select("estado_cuenta, es_admin, nombre_negocio")
    .eq("id", usuario.id)
    .maybeSingle<SesionNegocio>();

  if (!sesion?.es_admin) redirect("/panel");

  const { data: cuentas } = await supabase
    .from("usuarios_negocios")
    .select(
      "id, usuario, nombre_negocio, nombre_completo, telefono, estado_cuenta, creado_en, activacion_completa",
    )
    .neq("id", usuario.id)
    .order("creado_en", { ascending: false })
    .returns<CuentaAdmin[]>();

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-rosado-texto" strokeWidth={1.75} />
          <h1 className="font-titulo text-2xl font-semibold text-texto-primario">
            Administración
          </h1>
        </div>
        <BotonCerrarSesion />
      </div>
      <p className="mt-1 text-sm text-texto-secundario">
        Aprobá o rechazá el registro de nuevos negocios.
      </p>

      <GestionCuentas cuentasIniciales={cuentas ?? []} />
    </main>
  );
}
