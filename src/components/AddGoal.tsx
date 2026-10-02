import { useState, useEffect } from "react";
import { formatEUR, parseEURToCents } from "../lib/format";
import { NEON, GOAL_COLORS } from "../lib/theme";
import { DAY_MS, daysLeftOf, daysUntil, paceText, suggestTerm, termToDeadline } from "../lib/goals";
import { Sheet, Field, MoneyInput, inputCls } from "./forms";
import { DurationField } from "./DurationField";
import { MiniRing } from "./Rings";
import type { GoalView, NewGoalInput } from "../lib/models";

interface Form {
  name: string;
  target: string;
  saved: string;
  amount: string; // plazo: número que escribe el usuario...
  unit: number; // ...y su unidad (0 días, 1 semanas, 2 meses, 3 años)
  touched: boolean; // ¿ha tocado el plazo? Si no, al editar se conserva la fecha original
  color: string | null; // null = automático (el siguiente de la lista)
}
const EXAMPLES = ["Comprar tabla funboard", "Gastos del Border Collie", "Fondo de emergencia"];

const emptyForm = (): Form => ({ name: "", target: "", saved: "", amount: "6", unit: 2, touched: true, color: null });

const toInput = (cents: number): string => (cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2).replace(".", ","));

const fromGoal = (g: GoalView): Form => {
  const t = suggestTerm(Math.max(1, daysLeftOf(g)));
  return { name: g.name, target: toInput(g.target), saved: toInput(g.saved), amount: t.amount, unit: t.unit, touched: false, color: g.color };
};

/** Crea una meta nueva o, si recibe `goal`, edita (y permite eliminar) una existente. */
export function AddGoal({
  open,
  onClose,
  onSave,
  nextColor,
  goal,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (v: NewGoalInput) => void;
  nextColor: string;
  goal?: GoalView | null;
  onDelete?: () => void;
}) {
  const [f, setF] = useState<Form>(emptyForm);
  const [confirm, setConfirm] = useState(false);
  const set = (p: Partial<Form>) => setF((x) => ({ ...x, ...p }));
  const editing = !!goal;

  // Al abrir, carga la meta a editar o un formulario limpio
  useEffect(() => {
    if (open) {
      setF(goal ? fromGoal(goal) : emptyForm());
      setConfirm(false);
    }
  }, [open, goal?.id]);

  // El "¿seguro?" de eliminar caduca solo
  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), 4000);
    return () => clearTimeout(t);
  }, [confirm]);

  const color = f.color ?? nextColor;
  const target = parseEURToCents(f.target);
  const saved = f.saved.trim() === "" ? 0 : parseEURToCents(f.saved);
  const overSaved = target !== null && saved !== null && saved > target;

  // Fecha límite: la original si estás editando y no has tocado el plazo; si no, "N unidades desde hoy"
  const kept = goal?.deadline && !f.touched ? new Date(goal.deadline) : null;
  const deadline = kept ?? termToDeadline(f.amount, f.unit);
  const valid = target !== null && target > 0 && saved !== null && saved >= 0 && saved <= target && deadline !== null;

  const pct = target !== null && target > 0 && saved !== null ? saved / target : 0;
  const days = deadline ? Math.ceil((deadline.getTime() - Date.now()) / DAY_MS) : null;
  const hint = target !== null && target > 0 && saved !== null && days !== null && saved < target ? paceText(target, saved, days) : null;

  const save = () => {
    if (target === null || target <= 0 || saved === null || saved < 0 || saved > target || deadline === null) return;
    onSave({ name: f.name.trim() || "Nueva meta", target, saved, deadline: deadline.toISOString(), color });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? "Editar meta" : "Nueva meta"}
      subtitle={editing ? "Cambia lo que quieras o elimínala" : "Ponle nombre, importe y plazo"}
    >
      <div
        className="flex flex-1 flex-col gap-4 pt-1"
        onKeyDown={(e) => {
          if (e.key === "Enter" && valid) save();
        }}
      >
        {/* Vista previa del anillo */}
        <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-3">
          <MiniRing pct={pct} color={color} on={open} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold">{f.name.trim() || "Tu nueva meta"}</p>
            <p className="text-sm font-semibold tabular-nums" style={{ color }}>
              {formatEUR(saved ?? 0)} <span className="text-zinc-500">/ {target !== null && target > 0 ? formatEUR(target) : "—"}</span>
            </p>
            {hint && <p className="mt-0.5 text-xs text-zinc-400">{hint}</p>}
          </div>
          <span className="text-2xl font-black tabular-nums" style={{ color }}>
            {Math.round(pct * 100)}%
          </span>
        </div>

        <Field label="Nombre">
          <input value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ej. Comprar tabla funboard" className={inputCls} />
        </Field>
        {!editing && (
          <div className="-mt-2 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                type="button"
                key={ex}
                onClick={() => set({ name: ex })}
                className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-zinc-300 active:bg-white/10"
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Objetivo">
            <MoneyInput value={f.target} onChange={(v) => set({ target: v })} placeholder="Ej. 1.200,00" />
          </Field>
          <Field label={editing ? "Ahorrado hasta hoy" : "Ya ahorrado"}>
            <MoneyInput value={f.saved} onChange={(v) => set({ saved: v })} placeholder="0,00" />
          </Field>
        </div>
        {overSaved && (
          <p className="-mt-2 text-xs font-bold" style={{ color: NEON.pink }}>
            Lo ahorrado supera el objetivo.
          </p>
        )}

        <DurationField
          amount={f.amount}
          unit={f.unit}
          deadline={deadline}
          color={color}
          onChange={(v) => set({ ...v, touched: true })}
          note={kept ? "Este es el plazo actual. Si cambias el número, el plazo nuevo cuenta desde hoy." : undefined}
        />

        <div>
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">Color del anillo</span>
          <div className="flex gap-3">
            {GOAL_COLORS.map((c, i) => (
              <button
                type="button"
                key={c}
                aria-label={`Color ${i + 1}`}
                onClick={() => set({ color: c })}
                className="h-8 w-8 rounded-full transition-transform"
                style={{
                  background: c,
                  transform: color === c ? "scale(1.1)" : "scale(1)",
                  boxShadow: color === c ? `0 0 0 3px #18181b, 0 0 0 5px ${c}, 0 0 14px ${c}88` : "none",
                }}
              />
            ))}
          </div>
        </div>

        <div className="mt-auto space-y-3 pt-2">
          <button
            onClick={save}
            disabled={!valid}
            className="h-14 w-full rounded-2xl text-lg font-black text-black transition-opacity disabled:opacity-30"
            style={{ background: NEON.lime }}
          >
            {editing ? "Guardar cambios" : "Crear meta"}
          </button>
          {!valid && !overSaved && deadline !== null && (
            <p className="text-center text-xs text-zinc-500">Indica el importe objetivo para guardarla.</p>
          )}
          {editing && onDelete && (
            <button
              onClick={() => (confirm ? onDelete() : setConfirm(true))}
              className="h-12 w-full rounded-2xl border text-base font-black transition-colors"
              style={
                confirm
                  ? { background: NEON.pink, borderColor: NEON.pink, color: "#000" }
                  : { borderColor: NEON.pink + "88", color: NEON.pink }
              }
            >
              {confirm ? "Toca otra vez para eliminar" : "Eliminar meta"}
            </button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
