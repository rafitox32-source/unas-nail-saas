import { useId } from "react";

// Poste clásico de barbería francesa: rayas diagonales rojo/blanco/azul,
// remates dorados arriba y abajo. Ícono de marca (dos tonos, no
// currentColor) — mismo tratamiento que el isotipo de Florece.
export function IconoPosteBarbero({ className }: { className?: string }) {
  const id = `poste-rayas-${useId()}`;
  return (
    <svg viewBox="0 0 100 220" className={className} aria-hidden="true">
      <defs>
        <pattern
          id={id}
          width="26"
          height="26"
          patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse"
        >
          <rect width="26" height="9" fill="#c0392b" />
          <rect y="9" width="26" height="9" fill="#f5f2ec" />
          <rect y="18" width="26" height="9" fill="#2c4870" />
        </pattern>
      </defs>
      <rect x="8" y="24" width="84" height="172" rx="14" fill={`url(#${id})`} stroke="#1f1a17" strokeWidth="4" />
      <rect x="0" y="0" width="100" height="30" rx="10" fill="#b8935a" stroke="#1f1a17" strokeWidth="3" />
      <rect x="0" y="190" width="100" height="30" rx="10" fill="#b8935a" stroke="#1f1a17" strokeWidth="3" />
    </svg>
  );
}

// Bigote estilo manillar — usado como marca de agua decorativa repetida,
// siempre en currentColor para poder bajarle la opacidad al color de
// fondo que corresponda en cada tema.
export function IconoBigote({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 40" fill="currentColor" className={className} aria-hidden="true">
      <path d="M50 22c-4-13-22-19-36-13C4 13-1 24 8 29c6 3 12-1 14-7 2-6 8-9 16-9 6 0 10 3 12 9z" />
      <path d="M50 22c4-13 22-19 36-13 10 4 15 15 6 20-6 3-12-1-14-7-2-6-8-9-16-9-6 0-10 3-12 9z" />
    </svg>
  );
}
