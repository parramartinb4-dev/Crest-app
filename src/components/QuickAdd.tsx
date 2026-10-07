import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { X, Delete } from "lucide-react";
import { formatEUR } from "../lib/format";
import { NEON } from "../lib/theme";
import { CATS, detectCat } from "../lib/categories";
import { FREQS, FREQ_LABELS, FREQ_MATH, MONTH_SHORT, QUARTER_PATTERNS, WEEKDAYS, monthlyEquivalent, scheduleText } from "../lib/recurrence";
import { toDayKey } from "../lib/transactions";
import { Switch, CatIcon, Segmented } from "./ui";
import type { EditingEntry, Freq, NewTxInput, TxType } from "../lib/models";

interface Form {
  type: TxType;
  cents: number;
  name: string;
  card: boolean;
  fixed: boolean;
  freq: Freq;
  day: number; // día del mes (semanal: día de la semana 1-7)
  month: number; // trimestral: 1-3 · anual: 1-12
  date: string; // solo al editar un movimiento: "2026-10-02"
  retro: boolean; // solo al editar un fijo: aplicar el cambio a todo el historial
}

export const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "del"];

/** Día y mes por defecto al elegir una frecuencia. */
const freqDefaults = (freq: Freq): { day: number; month: number } => {
  const now = new Date();
  if (freq === "weekly") return { day: now.getDay() || 7, month: 1 };
  const day = Math.min(now.getDate(), 28);
  if (freq === "quarterly") return { day, month: (now.getMonth() % 3) + 1 };
  if (freq === "yearly") return { day, month: now.getMonth() + 1 };
  return { day, month: 1 };
};

const emptyForm = (): Form => ({ type: "expense", cents: 0, name: "", card: true, fixed: false, freq: "monthly", ...freqDefaults("monthly"), date: "", retro: false });

const fromEditing = (e: EditingEntry): Form =>
  e.kind === "rule"
    ? { type: e.rule.type, cents: e.rule.amount, name: e.rule.name, card: e.rule.method === "card", fixed: true, freq: e.rule.freq, day: e.rule.day, month: e.rule.month, date: "", retro: false }
    : { type: e.tx.type, cents: e.tx.amount, name: e.tx.name, card: e.tx.method === "card", fixed: false, freq: "monthly", ...freqDefaults("monthly"), date: toDayKey(e.tx.date), retro: false };

const parseDay = (s: string): Date | undefined => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : undefined;
};

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded-full border px-2 py-1 text-xs font-bold"
      style={{ borderColor: on ? NEON.lime : "rgba(255,255,255,0.15)", color: on ? NEON.lime : "#a1a1aa" }}
    >
      {children}
    </button>
  );
}

/** Alta rápida de un movimiento, y también edición de un movimiento o de un fijo existente (misma id en Firebase). */
export function QuickAdd({
  open,
  onClose,
  onSave,
  editing,
  onDelete,
  onStop,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (v: NewTxInput) => void;
  editing?: EditingEntry | null;
  onDelete?: () => void; // eliminar (en un fijo, también borra su historial)
  onStop?: () => void; // dejar de aplicar un fijo desde hoy (conserva el historial)
}) {
  const [f, setF] = useState<Form>(emptyForm);
  const [confirm, setConfirm] = useState(false);
  const set = (p: Partial<Form>) => setF((x) => ({ ...x, ...p }));
  const isRule = editing?.kind === "rule";
  const isTx = editing?.kind === "tx";
  const editingKey = editing ? (editing.kind === "rule" ? "r" + editing.rule.id : "t" + editing.tx.id) : "new";

  // Al abrir, carga el movimiento/fijo a editar o un formulario limpio
  useEffect(() => {
    if (open) {
      setF(editing ? fromEditing(editing) : emptyForm());
      setConfirm(false);
    }
  }, [open, editingKey]);
  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), 4000);
    return () => clearTimeout(t);
  }, [confirm]);

  const income = f.type === "income";
  const fixed = isRule || f.fixed;
  const cat = income ? CATS.ingreso : CATS[detectCat(f.name)];
  // Al cambiar de frecuencia se mantiene el día del mes (salvo si pasa de/a semanal) y se propone un mes razonable
  const setFreq = (i: number) => {
    const next = FREQS[i];
    const d = freqDefaults(next);
    set({ freq: next, month: d.month, day: next === "weekly" || f.freq === "weekly" ? d.day : f.day });
  };
  const press = (k: string) => {
    if (k === "del") return set({ cents: Math.floor(f.cents / 10) });
    const next = k === "00" ? f.cents * 100 : f.cents * 10 + Number(k);
    if (next <= 99999999) set({ cents: next });
  };
  const save = () => {
    if (!f.cents) return;
    onSave({
      type: f.type,
      amount: f.cents,
      name: f.name,
      method: income || !f.card ? "account" : "card",
      fixed,
      day: f.day,
      freq: f.freq,
      month: f.month,
      date: isTx ? parseDay(f.date) : undefined,
      retro: isRule ? f.retro : undefined,
    });
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
          {editing && <span className="text-xs font-bold text-zinc-500">{isRule ? "Editando fijo" : "Editando movimiento"}</span>}
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

            {!editing && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">{income ? "Ingreso fijo" : "Gasto fijo"}</p>
                  <p className="text-xs text-zinc-500">
                    {f.fixed ? `${income ? "Se ingresa" : "Se descuenta"} solo · ${scheduleText(f)}` : "Solo esta vez"}
                  </p>
                </div>
                <Switch on={f.fixed} onChange={(v) => set({ fixed: v })} color={NEON.lime} />
              </div>
            )}

            {fixed && (
              <>
                <Segmented options={FREQ_LABELS} value={FREQS.indexOf(f.freq)} onChange={setFreq} />
                {f.freq === "weekly" ? (
                  <div className="flex gap-1.5">
                    {WEEKDAYS.map((w, i) => (
                      <Chip key={w} on={f.day === i + 1} onClick={() => set({ day: i + 1 })}>
                        {w}
                      </Chip>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-300">Día del mes</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => set({ day: Math.max(1, f.day - 1) })} className="h-9 w-9 rounded-full bg-white/10 text-lg font-bold">−</button>
                      <span className="w-6 text-center text-lg font-black tabular-nums">{f.day}</span>
                      <button onClick={() => set({ day: Math.min(28, f.day + 1) })} className="h-9 w-9 rounded-full bg-white/10 text-lg font-bold">+</button>
                    </div>
                  </div>
                )}
                {f.freq === "quarterly" && (
                  <div className="flex gap-1.5">
                    {QUARTER_PATTERNS.map((p, i) => (
                      <Chip key={p} on={f.month === i + 1} onClick={() => set({ month: i + 1 })}>
                        {p}
                      </Chip>
                    ))}
                  </div>
                )}
                {f.freq === "yearly" && (
                  <div className="grid grid-cols-6 gap-1.5">
                    {MONTH_SHORT.map((m, i) => (
                      <Chip key={m} on={f.month === i + 1} onClick={() => set({ month: i + 1 })}>
                        {m}
                      </Chip>
                    ))}
                  </div>
                )}
                {f.freq !== "monthly" && (
                  <p className="text-xs font-bold" style={{ color: NEON.cyan }}>
                    Equivale a {formatEUR(monthlyEquivalent(f.cents, f.freq))}/mes en tu presupuesto ({FREQ_MATH[f.freq]})
                  </p>
                )}
              </>
            )}

            {isTx && (
              <label className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-300">Fecha</span>
                <input
                  type="date"
                  value={f.date}
                  max={toDayKey(new Date())}
                  onChange={(e) => set({ date: e.target.value })}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-sm font-bold text-white outline-none"
                />
              </label>
            )}

            {isRule && (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">Corregir un error</p>
                  <p className="text-xs text-zinc-500">
                    {f.retro ? "El cambio se aplica a todo el historial" : "El cambio vale desde hoy; los meses anteriores no se tocan"}
                  </p>
                </div>
                <Switch on={f.retro} onChange={(v) => set({ retro: v })} color={NEON.cyan} />
              </div>
            )}
          </div>

          <p className="my-4 text-center text-5xl font-black tabular-nums tracking-tighter" style={{ color: f.cents ? cat.hex : "#52525b" }}>
            {income ? "+" : ""}
            {formatEUR(f.cents)}
          </p>

          {editing && (
            <div className="mb-3 space-y-2">
              {isRule && onStop && (
                <button onClick={onStop} className="h-11 w-full rounded-2xl border border-white/20 text-sm font-black text-zinc-300">
                  Dejar de aplicar desde hoy (conserva el historial)
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => (confirm ? onDelete() : setConfirm(true))}
                  className="h-11 w-full rounded-2xl border text-sm font-black transition-colors"
                  style={confirm ? { background: NEON.pink, borderColor: NEON.pink, color: "#000" } : { borderColor: NEON.pink + "88", color: NEON.pink }}
                >
                  {confirm ? "Toca otra vez para eliminar" : isRule ? "Eliminar y borrar su historial" : "Eliminar movimiento"}
                </button>
              )}
            </div>
          )}
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
            {editing ? "Guardar cambios" : income ? (f.fixed ? "Guardar ingreso fijo" : "Guardar ingreso") : f.fixed ? "Guardar gasto fijo" : "Guardar gasto"}
          </button>
        </div>
      </div>
    </>
  );
}
