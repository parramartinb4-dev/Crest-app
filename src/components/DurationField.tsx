import { NEON } from "../lib/theme";
import { UNIT_NAMES, formatDate } from "../lib/goals";
import { Segmented } from "./ui";
import { inputCls } from "./forms";

const QUICK = [
  { label: "1 mes", amount: "1", unit: 2 },
  { label: "3 meses", amount: "3", unit: 2 },
  { label: "6 meses", amount: "6", unit: 2 },
  { label: "1 año", amount: "1", unit: 3 },
  { label: "2 años", amount: "2", unit: 3 },
];

/** Plazo libre: escribe un número y elige días, semanas, meses o años. Muestra la fecha resultante. */
export function DurationField({
  amount,
  unit,
  onChange,
  deadline,
  color = NEON.lime,
  note,
}: {
  amount: string;
  unit: number;
  onChange: (v: { amount: string; unit: number }) => void;
  deadline: Date | null; // fecha resultante (null = plazo no válido)
  color?: string;
  note?: string; // texto extra, p. ej. al editar una meta
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">Plazo</span>
      <input
        inputMode="decimal"
        value={amount}
        onChange={(e) => onChange({ amount: e.target.value, unit })}
        onFocus={(e) => e.target.select()}
        placeholder="Ej. 8"
        aria-label="Número de unidades del plazo"
        className={`${inputCls} text-2xl font-black tabular-nums`}
      />
      <div className="mt-2">
        <Segmented options={UNIT_NAMES} value={unit} onChange={(u) => onChange({ amount, unit: u })} />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {QUICK.map((q) => {
          const on = amount.trim() === q.amount && unit === q.unit;
          return (
            <button
              type="button"
              key={q.label}
              onClick={() => onChange({ amount: q.amount, unit: q.unit })}
              className="rounded-full border px-3 py-1 text-xs font-bold"
              style={{ borderColor: on ? color : "rgba(255,255,255,0.15)", color: on ? color : "#a1a1aa" }}
            >
              {q.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 pl-1 text-xs font-bold" style={{ color: deadline ? NEON.cyan : NEON.pink }}>
        {deadline ? `Vence el ${formatDate(deadline)}` : "Plazo no válido: de 1 día a 50 años."}
      </p>
      {note && <p className="mt-1 pl-1 text-xs text-zinc-500">{note}</p>}
    </div>
  );
}
