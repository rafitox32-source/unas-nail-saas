import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad",
};

export default function PaginaPrivacidad() {
  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-16">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-sm font-semibold text-rosado-texto hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

      <h1 className="font-titulo mt-6 text-3xl font-semibold text-texto-primario">
        Política de privacidad
      </h1>
      <p className="mt-1 text-sm text-texto-secundario">Última actualización: agosto de 2026</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-texto-secundario">
        <section>
          <h2 className="font-titulo text-lg font-semibold text-texto-primario">
            1. Qué datos recolectamos
          </h2>
          <p className="mt-2">
            De las <strong className="text-texto-primario">profesionales y negocios</strong>:
            nombre del negocio, nombre completo, teléfono, nombre de usuario y contraseña
            (guardada de forma cifrada, nunca en texto plano).
          </p>
          <p className="mt-2">
            De las <strong className="text-texto-primario">clientas</strong>: nombre y teléfono
            al reservar un turno. Si el negocio lo carga, también alergias, notas internas y
            fotos asociadas a una visita — esta información la administra cada negocio, no
            nosotros.
          </p>
        </section>

        <section>
          <h2 className="font-titulo text-lg font-semibold text-texto-primario">
            2. Para qué se usan
          </h2>
          <p className="mt-2">
            Exclusivamente para operar la plataforma: mostrar la carta pública de cada negocio,
            gestionar reservas, y darle a cada negocio las herramientas de su panel (agenda,
            clientas, inventario). No usamos estos datos con fines publicitarios ni los vendemos
            a terceros.
          </p>
        </section>

        <section>
          <h2 className="font-titulo text-lg font-semibold text-texto-primario">
            3. Con quién se comparten
          </h2>
          <p className="mt-2">
            Los datos se alojan en Supabase, nuestro proveedor de infraestructura (base de datos
            y autenticación). No compartimos esta información con nadie más, salvo que la ley lo
            exija.
          </p>
        </section>

        <section>
          <h2 className="font-titulo text-lg font-semibold text-texto-primario">
            4. Aislamiento entre negocios
          </h2>
          <p className="mt-2">
            Cada negocio solo puede ver y administrar sus propias clientas y datos — nunca los de
            otro negocio en la plataforma. Esto está garantizado a nivel de base de datos, no
            solo en la pantalla.
          </p>
        </section>

        <section>
          <h2 className="font-titulo text-lg font-semibold text-texto-primario">
            5. Tus derechos sobre tus datos
          </h2>
          <p className="mt-2">
            Podés pedir acceso, corrección o eliminación de tus datos en cualquier momento.
            Todavía no tenemos un formulario automático para esto — escribinos por WhatsApp desde
            el link de soporte y lo resolvemos directamente.
          </p>
        </section>

        <section>
          <h2 className="font-titulo text-lg font-semibold text-texto-primario">
            6. Seguridad
          </h2>
          <p className="mt-2">
            Toda la comunicación viaja cifrada (HTTPS). El acceso a los datos está restringido
            por reglas de seguridad a nivel de base de datos (Row Level Security), no solo por la
            interfaz de la aplicación.
          </p>
        </section>

        <section>
          <h2 className="font-titulo text-lg font-semibold text-texto-primario">7. Contacto</h2>
          <p className="mt-2">
            Ante cualquier consulta sobre esta política, escribinos por WhatsApp desde el link de
            soporte de la plataforma.
          </p>
        </section>
      </div>
    </main>
  );
}
