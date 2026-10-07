import { TODAY } from "./dates";
import { occurrencesBetween, ruleSegments } from "./recurrence";
import type { Tx, RecurringRule } from "./models";

export const monthKey = (d: Date) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");

/** "2026-09-30": clave del día (id de la foto diaria del patrimonio). */
export const toDayKey = (d: Date) => monthKey(d) + "-" + String(d.getDate()).padStart(2, "0");

export const signedAmt = (t: Tx) => (t.type === "income" ? t.amount : -t.amount);

export const sumTx = (a: Tx[]) => a.reduce((s, t) => s + signedAmt(t), 0);

/**
 * Movimientos de los gastos e ingresos fijos que ya tocaba aplicar (semanales, mensuales, trimestrales o anuales),
 * desde que se creó la regla (o desde el mes del saldo inicial, lo que sea más tarde) hasta hoy.
 * El saldo solo cuenta los posteriores al saldo inicial (filtro en AppShell); el control de gasto usa los del mes.
 */
export function recurringTxs(rules: RecurringRule[], since: Date): Tx[] {
  const out: Tx[] = [];
  const sinceMonth = new Date(since.getFullYear(), since.getMonth(), 1);
  for (const r of rules) {
    const [y, m] = (r.start ?? monthKey(since)).split("-").map(Number);
    let first = new Date(y, m - 1, 1);
    if (first.getTime() < sinceMonth.getTime()) first = sinceMonth;
    for (const seg of ruleSegments(r, first, TODAY)) {
      for (const date of occurrencesBetween(seg, seg.from, seg.to)) {
        out.push({
          id: `rec-${r.id}-${toDayKey(date)}`,
          ruleId: r.id,
          freq: seg.freq,
          name: r.name,
          amount: seg.amount,
          type: seg.type,
          cat: seg.type === r.type ? r.cat : seg.type === "income" ? "ingreso" : "otros",
          method: r.method,
          date,
          recurring: true,
        });
      }
    }
  }
  return out;
}

export const dayDiff = (d: Date) =>
  Math.round((new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 864e5);

export const dateLabel = (d: Date) => {
  const n = dayDiff(d);
  return n === 0 ? "Hoy" : n === 1 ? "Ayer" : d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
};
