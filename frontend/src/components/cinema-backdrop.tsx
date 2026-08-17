const POPCORN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cg fill='none' stroke='%23eab14c' stroke-width='1.5'%3E%3Cpath d='M18 24 L46 24 L42 58 L22 58 Z'/%3E%3Ccircle cx='24' cy='17' r='5'/%3E%3Ccircle cx='32' cy='13' r='6'/%3E%3Ccircle cx='40' cy='17' r='5'/%3E%3C/g%3E%3C/svg%3E";

const REEL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cg fill='none' stroke='%23eab14c' stroke-width='1.5'%3E%3Ccircle cx='32' cy='32' r='27'/%3E%3Ccircle cx='32' cy='32' r='6'/%3E%3Ccircle cx='32' cy='13' r='5'/%3E%3Ccircle cx='49' cy='23' r='5'/%3E%3Ccircle cx='49' cy='42' r='5'/%3E%3Ccircle cx='32' cy='51' r='5'/%3E%3Ccircle cx='15' cy='42' r='5'/%3E%3Ccircle cx='15' cy='23' r='5'/%3E%3C/g%3E%3C/svg%3E";

const TICKET =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cg fill='none' stroke='%23eab14c' stroke-width='1.5'%3E%3Cpath d='M8 20 H56 a4 4 0 0 1 0 8 a4 4 0 0 0 0 8 a4 4 0 0 1 0 8 H8 a4 4 0 0 1 0 -8 a4 4 0 0 0 0 -8 a4 4 0 0 1 0 -8 Z'/%3E%3Cline x1='32' y1='22' x2='32' y2='42' stroke-dasharray='3 3'/%3E%3C/g%3E%3C/svg%3E";

const CLAPPER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cg fill='none' stroke='%23eab14c' stroke-width='1.5'%3E%3Crect x='8' y='24' width='48' height='32' rx='2'/%3E%3Cpath d='M8 24 L13 12 L55 12 L52 24 Z'/%3E%3Cline x1='19' y1='12' x2='24' y2='24'/%3E%3Cline x1='31' y1='12' x2='36' y2='24'/%3E%3Cline x1='43' y1='12' x2='46' y2='24'/%3E%3C/g%3E%3C/svg%3E";

const GRAIN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E";

/** Atmosfera de cinema atrás de todas as páginas: luz de projetor, grão de
 * película e silhuetas (pipoca, rolo, ingresso, claquete) espalhadas e
 * discretas. Posicionado em %, então acompanha a altura de cada página. */
export function CinemaBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* glow suave de projetor vindo do topo */}
      <div
        className="absolute left-1/2 top-0 h-[560px] w-[1100px] -translate-x-1/2"
        style={{
          background: "radial-gradient(ellipse at top, rgba(234,177,76,0.16), transparent 70%)",
        }}
      />
      {/* segundo glow, mais quente, no meio da página */}
      <div
        className="absolute left-[8%] top-[45%] h-[420px] w-[700px]"
        style={{
          background: "radial-gradient(ellipse, rgba(193,68,47,0.10), transparent 70%)",
        }}
      />
      {/* terceiro glow perto do fim */}
      <div
        className="absolute right-[5%] top-[85%] h-[380px] w-[640px]"
        style={{
          background: "radial-gradient(ellipse, rgba(234,177,76,0.10), transparent 70%)",
        }}
      />

      {/* grão de película sutil por cima de tudo */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: `url("${GRAIN}")` }}
      />

      {/* silhuetas de cinema espalhadas pela página inteira, bem discretas */}
      <img src={REEL} alt="" className="absolute -right-10 top-[4%] h-40 w-40 opacity-[0.05]" />
      <img src={POPCORN} alt="" className="absolute -left-8 top-[16%] h-36 w-36 opacity-[0.05]" />
      <img src={CLAPPER} alt="" className="absolute -right-6 top-[28%] h-32 w-32 rotate-6 opacity-[0.045]" />
      <img src={TICKET} alt="" className="absolute left-[4%] top-[40%] h-28 w-28 -rotate-12 opacity-[0.05]" />
      <img src={REEL} alt="" className="absolute right-[6%] top-[52%] h-24 w-24 opacity-[0.04]" />
      <img src={POPCORN} alt="" className="absolute -left-4 top-[63%] h-32 w-32 rotate-3 opacity-[0.045]" />
      <img src={CLAPPER} alt="" className="absolute right-[10%] top-[74%] h-28 w-28 -rotate-6 opacity-[0.04]" />
      <img src={TICKET} alt="" className="absolute -left-6 top-[86%] h-24 w-24 rotate-12 opacity-[0.045]" />
      <img src={REEL} alt="" className="absolute left-[45%] top-[95%] h-20 w-20 opacity-[0.035]" />
    </div>
  );
}
