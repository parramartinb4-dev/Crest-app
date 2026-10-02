import { useState, useEffect } from "react";
import { formatEUR, parseDecimal, parseEURToCents, signed, signedPct } from "../lib/format";
import { NEON } from "../lib/theme";
import { Sheet, Field, MoneyInput, inputCls } from "./forms";
import type { NewHoldingInput } from "../lib/models";

interface Form {
  name: string;
  symbol: string;
  qty: string;
  avg: string;
  price: string;
}
const EMPTY: Form = { name: "", symbol: "", qty: "", avg: "", price: "" };

export function AddInvestment({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (v: NewHoldingInput) => void }) {
  const [f, setF] = useState<Form>(EMPTY);
  const set = (p: Partial<Form>) => setF((x) => ({ ...x, ...p }));
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setF(EMPTY), 450);
      return () => clearTimeout(t);
    }
  }, [open]);

  const qty = parseDecimal(f.qty);
  const avg = parseEURToCents(f.avg);
  const price = parseEURToCents(f.price);
  const valid = qty !== null && qty > 0 && avg !== null && avg > 0 && price !== null && price > 0;

  const value = qty !== null && qty > 0 && price !== null && price > 0 ? Math.round(qty * price) : null;
  const cost = qty !== null && qty > 0 && avg !== null && avg > 0 ? Math.round(qty * avg) : null;
  const gain = value !== null && cost !== null ? value - cost : null;

  const save = () => {
    if (qty === null || qty <= 0 || avg === null || avg <= 0 || price === null || price <= 0) return;
    const symbol = f.symbol.trim().toUpperCase();
    onSave({ name: f.name.trim() || symbol || "Inversión", symbol, qty, avg, price });
  };

  return (
    <Sheet open={open} onClose={onClose} title="Nueva inversión" subtitle="Fondos, acciones o cuentas remuneradas">
      <div
        className="flex flex-1 flex-col gap-4 pt-1"
        onKeyDown={(e) => {
          if (e.key === "Enter" && valid) save();
        }}
      >
        <Field label="Nombre">
          <input value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ej. Fondo indexado Global" className={inputCls} />
        </Field>
        <Field label="Símbolo / ISIN">
          <input
            value={f.symbol}
            onChange={(e) => set({ symbol: e.target.value })}
            placeholder="Ej. IE00BK5BQT80 o AAPL"
            autoCapitalize="characters"
            className={`${inputCls} uppercase placeholder:normal-case`}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cantidad">
            <input inputMode="decimal" value={f.qty} onChange={(e) => set({ qty: e.target.value })} placeholder="Ej. 62,5" className={`${inputCls} tabular-nums`} />
          </Field>
          <Field label="Precio medio">
            <MoneyInput value={f.avg} onChange={(v) => set({ avg: v })} placeholder="Ej. 92,00" />
          </Field>
        </div>
        <Field label="Precio actual" hint="Por participación, tal y como lo ves hoy en tu banco.">
          <MoneyInput value={f.price} onChange={(v) => set({ price: v })} placeholder="Ej. 105,00" />
        </Field>

        {value !== null && (
          <div className="space-y-1 rounded-2xl bg-white/5 p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-zinc-500">Valor actual</span>
              <span className="text-xl font-black tabular-nums" style={{ color: NEON.lime }}>
                {formatEUR(value)}
              </span>
            </div>
            {gain !== null && cost !== null && (
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold text-zinc-500">Ganancia / pérdida</span>
                <span className="text-sm font-extrabold tabular-nums" style={{ color: gain >= 0 ? NEON.lime : NEON.pink }}>
                  {signed(gain)} · {signedPct(gain / cost)}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-auto pt-2">
          <button
            onClick={save}
            disabled={!valid}
            className="h-14 w-full rounded-2xl text-lg font-black text-black transition-opacity disabled:opacity-30"
            style={{ background: NEON.lime }}
          >
            Guardar inversión
          </button>
          {!valid && <p className="mt-2 text-center text-xs text-zinc-500">Necesito cantidad, precio medio y precio actual.</p>}
        </div>
      </div>
    </Sheet>
  );
}
