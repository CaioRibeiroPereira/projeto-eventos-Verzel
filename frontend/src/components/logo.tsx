export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="6" width="18" height="14" rx="1.5" />
      <path d="M3 6l3-3h3l-3 3M9 6l3-3h3l-3 3M15 6l3-3h3l-3 3" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className = "", size = 26 }: { className?: string; size?: number }) {
  // texto escala junto com o ícone, mantendo a proporção do text-2xl
  // (1.5rem) original quando size fica no padrão (26).
  return (
    <span className={`flex items-center gap-2 text-accent ${className}`}>
      <LogoMark size={size} />
      <span
        className="font-display font-medium leading-none"
        style={{ fontSize: `${(size / 26) * 1.5}rem` }}
      >
        Cine Verzel
      </span>
    </span>
  );
}
