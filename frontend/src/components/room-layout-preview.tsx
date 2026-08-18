import { WheelchairIcon } from "@/components/icons";
import type { SeatRow } from "@/lib/api";

export function RoomLayoutPreview({ rows }: { rows: SeatRow[] }) {
  const seatCount = rows.reduce(
    (sum, row) => sum + row.slots.filter((s) => s !== "gap").length,
    0,
  );
  const accessibleCount = rows.reduce(
    (sum, row) => sum + row.slots.filter((s) => s === "accessible").length,
    0,
  );

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="w-5 text-center text-sm text-text-secondary">{row.label}</span>
          <div className="flex flex-1 flex-wrap gap-1">
            {row.slots.map((kind, slotIndex) => (
              <div
                key={slotIndex}
                title={
                  kind === "accessible"
                    ? "Assento acessível para cadeirante"
                    : kind === "gap"
                      ? "Corredor"
                      : "Assento"
                }
                className={
                  kind === "gap"
                    ? "flex h-7 w-7 items-center justify-center rounded border border-dashed opacity-40"
                    : "flex h-7 w-7 items-center justify-center rounded border text-xs"
                }
                style={
                  kind === "seat"
                    ? {
                        background: "var(--seat-available-bg)",
                        borderColor: "var(--seat-available-border)",
                        color: "var(--seat-available-text)",
                      }
                    : kind === "accessible"
                      ? {
                          background: "var(--verde-900)",
                          borderColor: "var(--verde-400)",
                          color: "var(--verde-200)",
                        }
                      : {
                          borderColor: "var(--color-border)",
                        }
                }
              >
                {kind === "accessible" ? <WheelchairIcon className="h-4 w-4" /> : null}
              </div>
            ))}
          </div>
        </div>
      ))}

      <p className="caption mt-1">
        {seatCount} assentos no total — {accessibleCount} acessíveis
      </p>
    </div>
  );
}
