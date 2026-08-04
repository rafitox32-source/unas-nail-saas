import Link from "next/link";
import { Users, CalendarClock, PackageOpen, ExternalLink, ShieldCheck } from "lucide-react";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import { ConfiguracionNegocio } from "@/components/interno/configuracion-negocio";
import type { Manicurista } from "@/lib/tipos";

export default async function PaginaPanel() {
  const supabase = await crearClienteServidor();
  const {
    data: { user: usuario },
  } = await supabase.auth.getUser();

  const { data: manicurista } = await supabase
    .from("usuarios_manicuristas")
    .select(
      "id, nombre_negocio, nombre_completo, telefono, biografia, color_marca, slug_publico, url_avatar, politica_cancelacion, es_admin",
    )
    .eq("id", usuario!.id)
    .maybeSingle<Manicurista & { es_admin: boolean }>();

  const { count: pendientesDeAprobar } = manicurista?.es_admin
    ? await supabase
        .from("usuarios_manicuristas")
        .select("id", { count: "exact", head: true })
        .eq("estado_cuenta", "pendiente")
    : { count: 0 };

  const [{ count: totalClientas }, { count: proximasCitas }, { data: insumos }] = await Promise.all([
    supabase.from("clientas").select("id", { count: "exact", head: true }),
    supabase
      .from("citas_apartados")
      .select("id", { count: "exact", head: true })
      .in("estado_cita", ["pendiente_seña", "confirmada"]),
    supabase.from("inventario").select("cantidad_actual, cantidad_minima_alerta"),
  ]);

  const insumosBajos =
    insumos?.filter((i) => i.cantidad_actual <= i.cantidad_minima_alerta).length ?? 0;

  const estadisticas = [
    { etiqueta: "Clientas", valor: totalClientas ?? 0, icono: Users, href: "/panel/clientas" },
    {
      etiqueta: "Próximas citas",
      valor: proximasCitas ?? 0,
      icono: CalendarClock,
      href: "/panel/agenda",
    },
    {
      etiqueta: "Para reponer",
      valor: insumosBajos,
      icono: PackageOpen,
      href: "/panel/inventario",
      alerta: insumosBajos > 0,
    },
  ];

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-titulo text-2xl font-semibold text-texto-primario">
          Hola{manicurista?.nombre_completo ? `, ${manicurista.nombre_completo}` : ""}
        </h1>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {estadisticas.map((stat) => {
            const Icono = stat.icono;
            return (
              <Link
                key={stat.etiqueta}
                href={stat.href}
                className={`flex flex-col items-center gap-1 rounded-2xl border p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  stat.alerta ? "border-alerta/30 bg-alerta-suave" : "border-borde bg-superficie"
                }`}
              >
                <Icono
                  className={`h-5 w-5 ${stat.alerta ? "text-alerta" : "text-rosado-texto"}`}
                  strokeWidth={1.75}
                />
                <span className="font-titulo text-xl font-semibold text-texto-primario">
                  {stat.valor}
                </span>
                <span className="text-[11px] text-texto-secundario">{stat.etiqueta}</span>
              </Link>
            );
          })}
        </div>

        {manicurista?.es_admin && (
          <Link
            href="/admin"
            className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-rosado/30 bg-rosado-suave p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-texto-primario">
              <ShieldCheck className="h-5 w-5 text-rosado-texto" strokeWidth={1.75} />
              Administración
            </span>
            {(pendientesDeAprobar ?? 0) > 0 ? (
              <span className="shrink-0 rounded-full bg-rosado px-2.5 py-1 text-xs font-semibold text-white">
                {pendientesDeAprobar} pendiente{pendientesDeAprobar === 1 ? "" : "s"}
              </span>
            ) : (
              <ExternalLink className="h-4 w-4 shrink-0 text-texto-secundario" />
            )}
          </Link>
        )}

        {manicurista ? (
          <>
            {manicurista.slug_publico && (
              <a
                href={`/${manicurista.slug_publico}`}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-rosado-texto hover:underline"
              >
                Ver mi página pública
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <ConfiguracionNegocio manicurista={manicurista} />
          </>
        ) : (
          <p className="mt-8 text-sm text-texto-secundario">
            Todavía no encontramos tu perfil de negocio.
          </p>
        )}
      </div>
    </main>
  );
}
