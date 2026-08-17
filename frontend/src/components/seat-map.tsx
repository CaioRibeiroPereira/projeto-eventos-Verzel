"use client";

import { WheelchairIcon } from "@/components/icons";
import type { SeatState } from "@/lib/api";

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
  selectedSeatId,
  onSelect,
}: {
  seats: SeatState[];
  selectedSeatId: number | null;
  onSelect: (seat: SeatState) => void;
}) {
  const rows = groupByRow(seats);

  return (
    <div className="flex flex-col items-center gap-2.5">
      {rows.map(([rowLabel, rowSeats]) => {
        const width = Math.max(...rowSeats.map((s) => s.col)) + 1;
        const byCol = new Map(rowSeats.map((s) => [s.col, s]));

        return (
          <div key={rowLabel} className="flex items-center gap-1.5">
            <span className="label w-6 text-right text-sm">{rowLabel}</span>
            {Array.from({ length: width }, (_, col) => {
              const seat = byCol.get(col);
              if (!seat) return <span key={col} className="h-11 w-11" />;

              const isSelected = seat.id === selectedSeatId;
              const state = seat.occupied
                ? "occupied"
                : isSelected
                  ? "selected"
                  : "available";

              return (
                <button
                  key={col}
                  type="button"
                  disabled={seat.occupied}
                  onClick={() => onSelect(seat)}
                  title={seat.accessible ? `${seat.label} — assento acessível` : seat.label}
                  className="flex h-11 w-11 items-center justify-center rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed"
                  style={
                    state === "selected"
                      ? {
                          background: "var(--seat-selected-bg)",
                          color: "var(--seat-selected-text)",
                        }
                      : state === "occupied"
                        ? {
                            background: "var(--seat-occupied-bg)",
                            color: "var(--seat-occupied-text)",
                          }
                        : {
                            background: seat.accessible
                              ? "var(--ambar-900)"
                              : "var(--seat-available-bg)",
                            borderWidth: seat.accessible ? 2 : 1,
                            borderColor: seat.accessible
                              ? "var(--color-accent)"
                              : "var(--seat-available-border)",
                            color: "var(--seat-available-text)",
                          }
                  }
                >
                  {seat.accessible ? (
                    <WheelchairIcon className="h-5 w-5" />
                  ) : (
                    seat.col + 1
                  )}
                </button>
              );
            })}
          </div>
        );
      })}

      <div className="mt-4 flex flex-wrap justify-center gap-4">
        <Legend swatch="var(--seat-available-bg)" border="var(--seat-available-border)" label="Disponível" />
        <Legend
          swatch="var(--ambar-900)"
          border="var(--color-accent)"
          icon
          label="Acessível"
        />
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
}: {
  swatch: string;
  border?: string;
  label: string;
  icon?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex h-4 w-4 items-center justify-center rounded"
        style={{ background: swatch, borderWidth: border ? 1.5 : 0, borderColor: border }}
      >
        {icon && <WheelchairIcon className="h-3 w-3 text-accent" />}
      </span>
      <span className="caption">{label}</span>
    </div>
  );
}
