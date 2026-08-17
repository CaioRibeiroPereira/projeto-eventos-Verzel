"use client";

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
    <div className="flex flex-col items-center gap-2">
      {rows.map(([rowLabel, rowSeats]) => {
        const width = Math.max(...rowSeats.map((s) => s.col)) + 1;
        const byCol = new Map(rowSeats.map((s) => [s.col, s]));

        return (
          <div key={rowLabel} className="flex items-center gap-1">
            <span className="label w-5 text-right">{rowLabel}</span>
            {Array.from({ length: width }, (_, col) => {
              const seat = byCol.get(col);
              if (!seat) return <span key={col} className="h-8 w-8" />;

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
                  title={seat.label}
                  className="flex h-8 w-8 items-center justify-center rounded text-xs transition-colors disabled:cursor-not-allowed"
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
                            background: "var(--seat-available-bg)",
                            borderWidth: 1,
                            borderColor: "var(--seat-available-border)",
                            color: "var(--seat-available-text)",
                          }
                  }
                >
                  {seat.col + 1}
                </button>
              );
            })}
          </div>
        );
      })}

      <div className="mt-4 flex gap-4">
        <Legend swatch="var(--seat-available-bg)" border="var(--seat-available-border)" label="Disponível" />
        <Legend swatch="var(--seat-selected-bg)" label="Selecionado" />
        <Legend swatch="var(--seat-occupied-bg)" label="Ocupado" />
      </div>
    </div>
  );
}

function Legend({ swatch, border, label }: { swatch: string; border?: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-4 w-4 rounded"
        style={{ background: swatch, borderWidth: border ? 1 : 0, borderColor: border }}
      />
      <span className="caption">{label}</span>
    </div>
  );
}
