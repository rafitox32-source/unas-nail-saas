import { redirect } from "next/navigation";
import { Clock3, XCircle } from "lucide-react";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { NavInterno } from "@/components/interno/nav-interno";
import { BotonCerrarSesion } from "@/components/interno/cerrar-sesion";
import type { SesionManicurista } from "@/lib/tipos";

export default async function LayoutInterno({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await crearClienteServidor();
  const {
    data: { user: usuario },
  } = await supabase.auth.getUser();

  if (!usuario) redirect("/ingresar");

  const { data: cuenta } = await supabase
    .from("usuarios_manicuristas")
    .select("estado_cuenta, es_admin, nombre_negocio")
    .eq("id", usuario.id)
    .maybeSingle<SesionManicurista>();

  if (cuenta && cuenta.estado_cuenta !== "aprobada") {
    const pendiente = cuenta.estado_cuenta === "pendiente";
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        {pendiente ? (
          <Clock3 className="h-10 w-10 text-dorado" strokeWidth={1.5} />
        ) : (
          <XCircle className="h-10 w-10 text-alerta" strokeWidth={1.5} />
        )}
        <h1 className="font-titulo text-2xl font-semibold text-texto-primario">
          {pendiente ? "Tu cuenta está en revisión" : "Tu cuenta no fue aprobada"}
        </h1>
        <p className="max-w-sm text-sm text-texto-secundario">
          {pendiente
            ? "Ya recibimos el registro de " +
              cuenta.nombre_negocio +
              ". En cuanto la aprobemos vas a poder entrar al panel."
            : "Si creés que es un error, contactanos para revisarlo."}
        </p>
        <BotonCerrarSesion />
      </main>
    );
  }

  return (
    <>
      <NavInterno />
      {children}
    </>
  );
}
