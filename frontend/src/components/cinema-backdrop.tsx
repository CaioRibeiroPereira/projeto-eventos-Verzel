const POPCORN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cg fill='none' stroke='%23eab14c' stroke-width='2'%3E%3Cpath d='M18 24 L46 24 L42 58 L22 58 Z'/%3E%3Ccircle cx='24' cy='17' r='5'/%3E%3Ccircle cx='32' cy='13' r='6'/%3E%3Ccircle cx='40' cy='17' r='5'/%3E%3C/g%3E%3C/svg%3E";

const REEL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cg fill='none' stroke='%23eab14c' stroke-width='2'%3E%3Ccircle cx='32' cy='32' r='27'/%3E%3Ccircle cx='32' cy='32' r='6'/%3E%3Ccircle cx='32' cy='13' r='5'/%3E%3Ccircle cx='49' cy='23' r='5'/%3E%3Ccircle cx='49' cy='42' r='5'/%3E%3Ccircle cx='32' cy='51' r='5'/%3E%3Ccircle cx='15' cy='42' r='5'/%3E%3Ccircle cx='15' cy='23' r='5'/%3E%3C/g%3E%3C/svg%3E";

/** Atmosfera de cinema (luz de projetor, textura de rolo de filme, pipoca) atrás do conteúdo. */
export function CinemaBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* faixa perfurada de filme no topo */}
      <div
        className="absolute inset-x-0 top-0 h-3 opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, var(--color-border-strong) 0 6px, transparent 6px 16px)",
        }}
      />

      {/* feixe de luz de projetor */}
      <div
        className="absolute inset-x-0 top-0 h-[520px]"
        style={{
          background:
            "repeating-conic-gradient(from 205deg at 50% -35%, rgba(234,177,76,0.10) 0deg 6deg, transparent 6deg 18deg)",
          maskImage: "linear-gradient(180deg, black, transparent)",
          WebkitMaskImage: "linear-gradient(180deg, black, transparent)",
        }}
      />
      <div
        className="absolute left-1/2 top-0 h-[420px] w-[900px] -translate-x-1/2 rounded-full opacity-25"
        style={{
          background: "radial-gradient(ellipse at top, var(--ambar-400), transparent 65%)",
          filter: "blur(10px)",
        }}
      />

      {/* pipoca e rolo de filme, bem discretos */}
      <img src={POPCORN} alt="" className="absolute -left-6 top-24 h-28 w-28 opacity-[0.06]" />
      <img src={REEL} alt="" className="absolute -right-8 top-72 h-36 w-36 opacity-[0.05]" />
      <img src={POPCORN} alt="" className="absolute right-10 bottom-10 h-20 w-20 opacity-[0.05]" />
    </div>
  );
}
