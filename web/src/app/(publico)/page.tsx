import { IconoMarca } from "@/components/icono-marca";

export default function PaginaInicio() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="text-center">
        <IconoMarca className="mx-auto h-9 w-9 text-rosado-texto" />
        <h1 className="font-titulo mt-3 text-4xl font-semibold text-texto-primario">
          Florece
        </h1>
        <p className="mt-3 text-texto-secundario">
          Reservas y gestión para spas, peluquerías y estudios de belleza — landing page en
          construcción.
        </p>
      </div>
    </main>
  );
}
