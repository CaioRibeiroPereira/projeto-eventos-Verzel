function Reel({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="32" cy="32" r="27" />
      <circle cx="32" cy="32" r="6" />
      <circle cx="32" cy="13" r="5" />
      <circle cx="49" cy="23" r="5" />
      <circle cx="49" cy="42" r="5" />
      <circle cx="32" cy="51" r="5" />
      <circle cx="15" cy="42" r="5" />
      <circle cx="15" cy="23" r="5" />
    </svg>
  );
}

function Popcorn({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M18 24 L46 24 L42 58 L22 58 Z" />
      <circle cx="24" cy="17" r="5" />
      <circle cx="32" cy="13" r="6" />
      <circle cx="40" cy="17" r="5" />
    </svg>
  );
}

function Ticket({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M8 20 H56 a4 4 0 0 1 0 8 a4 4 0 0 0 0 8 a4 4 0 0 1 0 8 H8 a4 4 0 0 1 0 -8 a4 4 0 0 0 0 -8 a4 4 0 0 1 0 -8 Z" />
      <line x1="32" y1="22" x2="32" y2="42" strokeDasharray="3 3" />
    </svg>
  );
}

function Clapper({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="8" y="24" width="48" height="32" rx="2" />
      <path d="M8 24 L13 12 L55 12 L52 24 Z" />
      <line x1="19" y1="12" x2="24" y2="24" />
      <line x1="31" y1="12" x2="36" y2="24" />
      <line x1="43" y1="12" x2="46" y2="24" />
    </svg>
  );
}

/** Mesma família visual do CinemaBackdrop do cliente (bobina, pipoca,
 * ingresso, claquete), só que clara e discreta pra caber no tema
 * profissional da área administrativa (organizador/portaria). A cor
 * segue --color-accent do escopo .theme-admin/.theme-gate, então já
 * muda sozinha entre as duas áreas. */
export function AdminCinemaBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden text-accent">
      <div
        className="absolute left-1/2 top-0 h-[480px] w-[1000px] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse at top, color-mix(in srgb, var(--color-accent) 10%, transparent), transparent 70%)",
        }}
      />
      <div
        className="absolute right-[6%] top-[55%] h-[360px] w-[600px]"
        style={{
          background:
            "radial-gradient(ellipse, color-mix(in srgb, var(--color-accent) 7%, transparent), transparent 70%)",
        }}
      />
      <div
        className="absolute left-[10%] top-[110%] h-[400px] w-[680px]"
        style={{
          background:
            "radial-gradient(ellipse, color-mix(in srgb, var(--color-accent) 8%, transparent), transparent 70%)",
        }}
      />
      <div
        className="absolute right-[15%] top-[150%] h-[340px] w-[560px]"
        style={{
          background:
            "radial-gradient(ellipse, color-mix(in srgb, var(--color-accent) 6%, transparent), transparent 70%)",
        }}
      />

      <Reel className="absolute -right-8 top-[6%] h-36 w-36 opacity-[0.07]" />
      <Popcorn className="absolute -left-6 top-[18%] h-32 w-32 opacity-[0.06]" />
      <Clapper className="absolute -right-4 top-[32%] h-28 w-28 rotate-6 opacity-[0.06]" />
      <Ticket className="absolute left-[4%] top-[46%] h-24 w-24 -rotate-12 opacity-[0.06]" />
      <Reel className="absolute right-[8%] top-[62%] h-20 w-20 opacity-[0.05]" />
      <Popcorn className="absolute -left-4 top-[78%] h-28 w-28 rotate-3 opacity-[0.05]" />
      <Clapper className="absolute right-[12%] top-[90%] h-24 w-24 -rotate-6 opacity-[0.05]" />

      <Ticket className="absolute right-[30%] top-[10%] h-20 w-20 rotate-6 opacity-[0.05]" />
      <Reel className="absolute left-[38%] top-[24%] h-16 w-16 opacity-[0.045]" />
      <Popcorn className="absolute right-[38%] top-[40%] h-24 w-24 -rotate-6 opacity-[0.05]" />
      <Clapper className="absolute left-[42%] top-[56%] h-20 w-20 rotate-12 opacity-[0.045]" />
      <Reel className="absolute -left-8 top-[68%] h-28 w-28 opacity-[0.055]" />
      <Ticket className="absolute right-[4%] top-[80%] h-20 w-20 rotate-3 opacity-[0.05]" />
      <Popcorn className="absolute left-[45%] top-[92%] h-20 w-20 rotate-6 opacity-[0.045]" />

      <Clapper className="absolute -left-6 top-[104%] h-28 w-28 -rotate-3 opacity-[0.05]" />
      <Reel className="absolute right-[20%] top-[116%] h-24 w-24 opacity-[0.05]" />
      <Ticket className="absolute left-[30%] top-[128%] h-20 w-20 -rotate-6 opacity-[0.045]" />
      <Popcorn className="absolute -right-8 top-[140%] h-32 w-32 rotate-3 opacity-[0.05]" />
      <Clapper className="absolute left-[6%] top-[152%] h-24 w-24 rotate-6 opacity-[0.045]" />
      <Reel className="absolute right-[40%] top-[164%] h-20 w-20 opacity-[0.04]" />
    </div>
  );
}
