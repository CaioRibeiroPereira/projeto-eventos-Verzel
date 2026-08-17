export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="6" width="18" height="14" rx="1.5" />
      <path d="M3 6l3-3h3l-3 3M9 6l3-3h3l-3 3M15 6l3-3h3l-3 3" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 text-accent ${className}`}>
      <LogoMark />
      <span className="font-display text-2xl font-medium leading-none">Cine Verzel</span>
    </span>
  );
}
