import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y condiciones",
};

export default function PaginaTerminos() {
  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-16">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-sm font-semibold text-rosado-texto hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

      <h1 className="font-titulo mt-6 text-3xl font-semibold text-texto-primario">
        Términos y condiciones
      </h1>
      <p className="mt-1 text-sm text-texto-secundario">Última actualización: agosto de 2026</p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-texto-secundario">
        <section>
          <h2 className="font-titulo text-lg font-semibold text-texto-primario">
            1. Qué es esta plataforma
          </h2>
          <p className="mt-2">
            Esta plataforma ofrece a manicuristas y estudios de uñas ("negocios") una página
            pública para mostrar sus servicios y recibir reservas, junto con un panel de
            administración para gestionar su agenda, clientas e inventario. No somos dueños de
            los negocios que operan acá — cada uno es independiente y responsable de la
            información que carga.
          </p>
        </section>

        <section>
          <h2 className="font-titulo text-lg font-semibold text-texto-primario">
            2. Cuentas y aprobación
          </h2>
          <p className="mt-2">
            Todo registro de un negocio nuevo queda pendiente de revisión antes de activarse.
            Nos reservamos el derecho de aprobar, rechazar o dar de baja una cuenta a nuestro
            criterio, incluyendo por uso indebido de la plataforma.
          </p>
        </section>

        <section>
          <h2 className="font-titulo text-lg font-semibold text-texto-primario">
            3. Reservas y señas
          </h2>
          <p className="mt-2">
            La plataforma no procesa pagos en línea. Cualquier seña o pago asociado a una
            reserva se coordina directamente entre la clienta y el negocio (por ejemplo, por
            WhatsApp). No somos parte de esa transacción ni responsables por disputas de pago,
            cancelaciones o reembolsos — eso queda a criterio de cada negocio y su propia
            política de cancelación, si la tiene publicada.
          </p>
        </section>

        <section>
          <h2 className="font-titulo text-lg font-semibold text-texto-primario">
            4. Contenido cargado por cada negocio
          </h2>
          <p className="mt-2">
            Cada negocio es responsable de la veracidad de sus servicios, precios, fotos y demás
            contenido publicado en su página. No verificamos ni garantizamos la exactitud de esa
            información.
          </p>
        </section>

        <section>
          <h2 className="font-titulo text-lg font-semibold text-texto-primario">5. Uso aceptable</h2>
          <p className="mt-2">
            No está permitido usar la plataforma para cargar contenido ofensivo, ilegal o
            fraudulento, ni intentar vulnerar su seguridad (por ejemplo, generando reservas
            falsas de forma automatizada).
          </p>
        </section>

        <section>
          <h2 className="font-titulo text-lg font-semibold text-texto-primario">
            6. Límite de responsabilidad
          </h2>
          <p className="mt-2">
            La plataforma se ofrece "tal cual", sin garantías de disponibilidad ininterrumpida.
            No somos responsables por pérdidas derivadas del uso o la imposibilidad de uso del
            servicio.
          </p>
        </section>

        <section>
          <h2 className="font-titulo text-lg font-semibold text-texto-primario">
            7. Cambios a estos términos
          </h2>
          <p className="mt-2">
            Podemos actualizar estos términos en cualquier momento. Los cambios importantes se
            van a reflejar en esta misma página con su fecha de actualización.
          </p>
        </section>

        <section>
          <h2 className="font-titulo text-lg font-semibold text-texto-primario">8. Contacto</h2>
          <p className="mt-2">
            Ante cualquier duda sobre estos términos, podés escribirnos directamente por
            WhatsApp desde el link de soporte de la plataforma.
          </p>
        </section>
      </div>
    </main>
  );
}
