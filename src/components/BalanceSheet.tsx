import { useEffect, useState } from "react";
import { centsToInput, parseEURToCents, signed } from "../lib/format";
import { NEON } from "../lib/theme";
import { Sheet, Field, MoneyInput } from "./forms";

/** Corregir el saldo: pones el que ves en tu banco y Crest recalcula tu saldo inicial para que cuadre. */
export function BalanceSheet({ open, onClose, balance, onSave }: { open: boolean; onClose: () => void; balance: number; onSave: (cents: number) => void }) {
  const [v, setV] = useState("");
  useEffect(() => {
    if (open) setV(centsToInput(balance));
  }, [open]);
  const cents = parseEURToCents(v);

  return (
    <Sheet open={open} onClose={onClose} title="Ajustar saldo" subtitle="Pon el saldo real que ves ahora en tu banco">
      <div
        className="flex flex-1 flex-col gap-4 pt-1"
        onKeyDown={(e) => {
          if (e.key === "Enter" && cents !== null) onSave(cents);
        }}
      >
        <Field label="Saldo actual">
          <MoneyInput value={v} onChange={setV} placeholder="Ej. 1.842,50" />
        </Field>
        {cents !== null && (
          <p className="text-sm font-bold tabular-nums" style={{ color: cents - balance >= 0 ? NEON.lime : NEON.pink }}>
            Diferencia con lo que muestra Crest: {signed(cents - balance)}
          </p>
        )}
        <p className="text-xs text-zinc-500">Crest recalcula tu saldo inicial para que cuadre. Tus movimientos no se tocan.</p>
        <div className="mt-auto pt-2">
          <button
            onClick={() => cents !== null && onSave(cents)}
            disabled={cents === null}
            className="h-14 w-full rounded-2xl text-lg font-black text-black transition-opacity disabled:opacity-30"
            style={{ background: NEON.lime }}
          >
            Guardar saldo
          </button>
        </div>
      </div>
    </Sheet>
  );
}
