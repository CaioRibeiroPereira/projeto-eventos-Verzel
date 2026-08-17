"use client";

import { WheelchairIcon } from "@/components/icons";
import type { SeatRow, SlotKind } from "@/lib/api";

function nextLabel(existing: string[]): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const letter of letters) {
    if (!existing.includes(letter)) return letter;
  }
  return `R${existing.length + 1}`;
}

const NEXT_KIND: Record<SlotKind, SlotKind> = {
  seat: "accessible",
  accessible: "gap",
  gap: "seat",
};

const SLOT_TITLE: Record<SlotKind, string> = {
  seat: "Assento (clique para virar acessível)",
  accessible: "Assento acessível para cadeirante (clique para virar corredor)",
  gap: "Corredor (clique para virar assento)",
};

export function SeatLayoutEditor({
  rows,
  onChange,
}: {
  rows: SeatRow[];
  onChange: (rows: SeatRow[]) => void;
}) {
  const seatCount = rows.reduce(
    (sum, row) => sum + row.slots.filter((s) => s !== "gap").length,
    0,
  );
  const accessibleCount = rows.reduce(
    (sum, row) => sum + row.slots.filter((s) => s === "accessible").length,
    0,
  );

  function addRow() {
    const label = nextLabel(rows.map((r) => r.label));
    onChange([...rows, { label, slots: Array(8).fill("seat") }]);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  function updateLabel(index: number, label: string) {
    onChange(rows.map((r, i) => (i === index ? { ...r, label } : r)));
  }

  function updateWidth(index: number, width: number) {
    onChange(
      rows.map((r, i) => {
        if (i !== index) return r;
        const slots = r.slots.slice(0, width);
        while (slots.length < width) slots.push("seat");
        return { ...r, slots };
      }),
    );
  }

  function cycleSlot(rowIndex: number, slotIndex: number) {
    onChange(
      rows.map((r, i) =>
        i === rowIndex
          ? {
              ...r,
              slots: r.slots.map((s, j) => (j === slotIndex ? NEXT_KIND[s] : s)),
            }
          : r,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-3 rounded border border-border bg-surface-2 p-3"
        >
          <input
            value={row.label}
            onChange={(e) => updateLabel(rowIndex, e.target.value)}
            className="w-12 rounded border border-border bg-surface-1 px-2 py-1 text-center text-sm text-text"
            maxLength={3}
          />
          <input
            type="number"
            min={1}
            max={40}
            value={row.slots.length}
            onChange={(e) => updateWidth(rowIndex, Number(e.target.value))}
            className="w-16 rounded border border-border bg-surface-1 px-2 py-1 text-center text-sm text-text"
          />
          <div className="flex flex-1 flex-wrap gap-1">
            {row.slots.map((kind, slotIndex) => (
              <button
                key={slotIndex}
                type="button"
                onClick={() => cycleSlot(rowIndex, slotIndex)}
                title={SLOT_TITLE[kind]}
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
                {kind === "accessible" ? (
                  <WheelchairIcon className="h-4 w-4" />
                ) : kind === "seat" ? (
                  slotIndex + 1
                ) : (
                  ""
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => removeRow(rowIndex)}
            className="text-sm text-red hover:underline"
          >
            Remover
          </button>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addRow}
          className="w-fit rounded border border-border px-3 py-1.5 text-sm text-text-secondary hover:border-accent hover:text-accent"
        >
          + Adicionar fileira
        </button>
        <p className="caption">
          {seatCount} assentos no total
          {accessibleCount > 0 && ` — ${accessibleCount} acessíveis`}
        </p>
      </div>
    </div>
  );
}
