import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { NavInterno } from "@/components/interno/nav-interno";

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

  return (
    <>
      <NavInterno />
      {children}
    </>
  );
}
