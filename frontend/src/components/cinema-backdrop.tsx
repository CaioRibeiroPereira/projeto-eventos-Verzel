const POPCORN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cg fill='none' stroke='%23eab14c' stroke-width='1.5'%3E%3Cpath d='M18 24 L46 24 L42 58 L22 58 Z'/%3E%3Ccircle cx='24' cy='17' r='5'/%3E%3Ccircle cx='32' cy='13' r='6'/%3E%3Ccircle cx='40' cy='17' r='5'/%3E%3C/g%3E%3C/svg%3E";

const REEL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cg fill='none' stroke='%23eab14c' stroke-width='1.5'%3E%3Ccircle cx='32' cy='32' r='27'/%3E%3Ccircle cx='32' cy='32' r='6'/%3E%3Ccircle cx='32' cy='13' r='5'/%3E%3Ccircle cx='49' cy='23' r='5'/%3E%3Ccircle cx='49' cy='42' r='5'/%3E%3Ccircle cx='32' cy='51' r='5'/%3E%3Ccircle cx='15' cy='42' r='5'/%3E%3Ccircle cx='15' cy='23' r='5'/%3E%3C/g%3E%3C/svg%3E";

const GRAIN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E";

/** Atmosfera de cinema (luz de projetor, grão de película, pipoca) fixa atrás da página inteira. */
export function CinemaBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* glow suave de projetor vindo do topo */}
      <div
        className="absolute left-1/2 top-0 h-[70vh] w-[1100px] -translate-x-1/2"
        style={{
          background: "radial-gradient(ellipse at top, rgba(234,177,76,0.16), transparent 70%)",
        }}
      />

      {/* grão de película sutil por cima de tudo */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: `url("${GRAIN}")` }}
      />

      {/* pipoca e rolo de filme, marca d'água discreta */}
      <img src={REEL} alt="" className="absolute -right-10 top-[15vh] h-40 w-40 opacity-[0.04]" />
      <img src={POPCORN} alt="" className="absolute -left-8 top-[55vh] h-36 w-36 opacity-[0.04]" />
      <img src={REEL} alt="" className="absolute right-4 bottom-[8vh] h-24 w-24 opacity-[0.03]" />
    </div>
  );
}
