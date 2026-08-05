export function IconoMarca({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <g fill="currentColor">
        <rect x="176" y="130" width="46" height="252" rx="16" />
        <rect x="176" y="130" width="164" height="46" rx="16" />
        <rect x="176" y="234" width="140" height="46" rx="16" />
      </g>
      <ellipse cx="340" cy="146" rx="34" ry="20" transform="rotate(28 340 146)" fill="#B8935A" />
    </svg>
  );
}
