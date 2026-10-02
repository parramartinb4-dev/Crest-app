import { useState, useEffect } from "react";
import { X, Delete } from "lucide-react";
import { formatEUR } from "../lib/format";
import { NEON } from "../lib/theme";
import { TODAY } from "../lib/dates";
import { CATS, detectCat } from "../lib/categories";
import { Switch, CatIcon } from "./ui";
import type { TxType, NewTxInput } from "../lib/models";

interface Form {
  type: TxType;
  cents: number;
  name: string;
  card: boolean;
  fixed: boolean;
  day: number;
}

export const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "del"];

export function QuickAdd({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (v: NewTxInput) => void }) {
  const initial: Form = { type: "expense", cents: 0, name: "", card: true, fixed: false, day: Math.min(TODAY.getDate(), 28) };
  const [f, setF] = useState<Form>(initial);
  const set = (p: Partial<Form>) => setF((x) => ({ ...x, ...p }));
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setF(initial), 450);
      return () => clearTimeout(t);
    }
  }, [open]);

  const income = f.type === "income";
  const cat = income ? CATS.ingreso : CATS[detectCat(f.name)];
  const press = (k: string) => {
    if (k === "del") return set({ cents: Math.floor(f.cents / 10) });
    const next = k === "00" ? f.cents * 100 : f.cents * 10 + Number(k);
    if (next <= 99999999) set({ cents: next });
  };
  const save = () => {
    if (!f.cents) return;
    onSave({ type: f.type, amount: f.cents, name: f.name, method: income || !f.card ? "account" : "card", fixed: f.fixed, day: f.day });
  };

  return (
    <>
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        style={{ zIndex: 55, opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 mx-auto flex max-w-md flex-col rounded-t-3xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl"
        style={{ zIndex: 60, height: "92%", transform: open ? "translateY(0)" : "translateY(105%)", transition: "transform 420ms cubic-bezier(.22,1,.36,1)" }}
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <div className="flex rounded-full bg-white/10 p-1">
            {([["expense", "Gasto"], ["income", "Ingreso"]] as [TxType, string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => set({ type: id })}
                className="rounded-full px-4 py-1.5 text-sm font-bold transition-colors"
                style={{ background: f.type === id ? "#fff" : "transparent", color: f.type === id ? "#000" : "#a1a1aa" }}
              >
                {label}
              </button>
            ))}
          </div>
          <button aria-label="Cerrar" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <X size={18} />
          </button>
        </div>

        <div className="no-sb flex-1 overflow-y-auto px-5">
          {/* Concepto → categoría en tiempo real */}
          <div className="mt-2 flex items-center gap-3">
            <CatIcon cat={cat} size={52} />
            <div className="min-w-0 flex-1">
              <input
                value={f.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder={income ? "Concepto (Nómina…)" : "Concepto (gasolina, cena…)"}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-base font-semibold text-white outline-none placeholder:text-zinc-500 focus:border-white/30"
              />
              <p className={`mt-1 pl-1 text-xs font-bold ${cat.cls}`}>{cat.label}</p>
            </div>
          </div>

          <div className="mt-3 space-y-3 rounded-2xl bg-white/5 p-3">
            {!income && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{ color: f.card ? "#71717a" : "#fff" }}>Cuenta</span>
                <Switch on={f.card} onChange={(v) => set({ card: v })} color={NEON.cyan} />
                <span className="text-sm font-bold" style={{ color: f.card ? "#fff" : "#71717a" }}>Tarjeta</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">{income ? "Ingreso fijo mensual" : "Gasto fijo mensual"}</p>
                <p className="text-xs text-zinc-500">
                  {f.fixed ? (income ? `Se ingresa solo el día ${f.day}` : `Se descuenta solo el día ${f.day}`) : "Solo esta vez"}
                </p>
              </div>
              <Switch on={f.fixed} onChange={(v) => set({ fixed: v })} color={NEON.lime} />
            </div>
            {f.fixed && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-300">Día del mes</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => set({ day: Math.max(1, f.day - 1) })} className="h-9 w-9 rounded-full bg-white/10 text-lg font-bold">−</button>
                  <span className="w-6 text-center text-lg font-black tabular-nums">{f.day}</span>
                  <button onClick={() => set({ day: Math.min(28, f.day + 1) })} className="h-9 w-9 rounded-full bg-white/10 text-lg font-bold">+</button>
                </div>
              </div>
            )}
          </div>

          <p className="my-4 text-center text-5xl font-black tabular-nums tracking-tighter" style={{ color: f.cents ? cat.hex : "#52525b" }}>
            {income ? "+" : ""}
            {formatEUR(f.cents)}
          </p>
        </div>

        {/* Teclado grande para el pulgar */}
        <div className="px-5 pb-5">
          <div className="grid grid-cols-3 gap-2">
            {KEYS.map((k) => (
              <button
                key={k}
                onClick={() => press(k)}
                className="flex h-14 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold active:bg-white/25"
              >
                {k === "del" ? <Delete size={26} /> : k}
              </button>
            ))}
          </div>
          <button
            onClick={save}
            disabled={!f.cents}
            className="mt-3 h-14 w-full rounded-2xl text-lg font-black text-black transition-opacity disabled:opacity-30"
            style={{ background: NEON.lime }}
          >
            {income ? (f.fixed ? "Guardar ingreso fijo" : "Guardar ingreso") : f.fixed ? "Guardar gasto fijo" : "Guardar gasto"}
          </button>
        </div>
      </div>
    </>
  );
}
