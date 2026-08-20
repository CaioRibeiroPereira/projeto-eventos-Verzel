"use client";

import { WheelchairIcon } from "@/components/icons";
import type { SeatState } from "@/lib/api";

const SEAT_STYLES: Record<"available" | "accessible" | "selected" | "occupied", React.CSSProperties> = {
  available: {
    background: "var(--seat-available-bg)",
    borderWidth: 1,
    borderColor: "var(--seat-available-border)",
    color: "var(--seat-available-text)",
  },
  accessible: {
    background: "var(--verde-900)",
    borderWidth: 2,
    borderColor: "var(--verde-400)",
    color: "var(--verde-200)",
  },
  selected: {
    background: "var(--seat-selected-bg)",
    color: "var(--seat-selected-text)",
  },
  occupied: {
    background: "var(--seat-occupied-bg)",
    color: "var(--seat-occupied-text)",
  },
};

function groupByRow(seats: SeatState[]) {
  const rows = new Map<string, SeatState[]>();
  for (const seat of seats) {
    const list = rows.get(seat.row_label) ?? [];
    list.push(seat);
    rows.set(seat.row_label, list);
  }
  return [...rows.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function SeatMap({
  seats,
  selectedSeatIds,
  onToggle,
  flashSeatIds,
}: {
  seats: SeatState[];
  selectedSeatIds: number[];
  onToggle: (seat: SeatState) => void;
  /** Assentos que acabaram de mudar de ocupação (aviso em tempo real) — piscam por um instante. */
  flashSeatIds?: Set<number>;
}) {
  const rows = groupByRow(seats);

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="max-w-full overflow-x-auto pb-1">
        <div className="flex w-fit flex-col items-center gap-1.5 sm:gap-2.5">
          {rows.map(([rowLabel, rowSeats]) => {
            const width = Math.max(...rowSeats.map((s) => s.col)) + 1;
            const byCol = new Map(rowSeats.map((s) => [s.col, s]));

            return (
              <div key={rowLabel} className="flex items-center gap-1 sm:gap-1.5">
                <span className="label w-5 shrink-0 text-right text-sm sm:w-6">{rowLabel}</span>
                {Array.from({ length: width }, (_, col) => {
                  const seat = byCol.get(col);
                  if (!seat) return <span key={col} className="h-8 w-8 shrink-0 sm:h-11 sm:w-11" />;

                  const isSelected = selectedSeatIds.includes(seat.id);
                  const state = isSelected
                    ? "selected"
                    : seat.occupied
                      ? "occupied"
                      : seat.accessible
                        ? "accessible"
                        : "available";

                  return (
                    <button
                      key={col}
                      type="button"
                      disabled={seat.occupied}
                      onClick={() => onToggle(seat)}
                      title={seat.accessible ? `${seat.label} — assento acessível` : seat.label}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-medium transition-colors disabled:cursor-not-allowed sm:h-11 sm:w-11 sm:text-sm ${
                        flashSeatIds?.has(seat.id) ? "seat-flash" : ""
                      }`}
                      style={SEAT_STYLES[state]}
                    >
                      {seat.accessible ? (
                        <WheelchairIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        seat.col + 1
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-4">
        <Legend swatch="var(--seat-available-bg)" border="var(--seat-available-border)" label="Disponível" />
        <Legend swatch="var(--verde-900)" border="var(--verde-400)" iconColor="var(--verde-400)" icon label="Acessível" />
        <Legend swatch="var(--seat-selected-bg)" label="Selecionado" />
        <Legend swatch="var(--seat-occupied-bg)" label="Ocupado" />
      </div>
    </div>
  );
}

function Legend({
  swatch,
  border,
  label,
  icon,
  iconColor,
}: {
  swatch: string;
  border?: string;
  label: string;
  icon?: boolean;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex h-4 w-4 items-center justify-center rounded"
        style={{ background: swatch, borderWidth: border ? 1.5 : 0, borderColor: border }}
      >
        {icon && <WheelchairIcon className="h-3 w-3" style={{ color: iconColor }} />}
      </span>
      <span className="caption">{label}</span>
    </div>
  );
}
