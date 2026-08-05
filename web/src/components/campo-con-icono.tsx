export function CampoConIcono({
  icono: Icono,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icono: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative mt-1">
      <Icono className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-secundario" />
      <input
        {...props}
        className={`w-full rounded-xl border border-borde bg-fondo py-2.5 pl-10 pr-4 text-texto-primario transition-colors focus:border-rosado focus:outline-none ${className ?? ""}`}
      />
    </div>
  );
}
