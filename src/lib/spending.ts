import { TODAY } from "./dates";
import { monthKey } from "./transactions";
import type { Tx, RecurringRule, StatusKey, SpendMetrics } from "./models";

/**
 * Los gastos fijos se reservan del límite; el semáforo mide el gasto VARIABLE
 * contra su parte proporcional del mes. Ahorro/inversión no cuenta como gasto.
 * Umbrales: ≤90 % verde, ≤110 % amarillo, resto rojo.
 */
export const DIM = new Date(TODAY.getFullYear(), TODAY.getMonth() + 1, 0).getDate(); // días del mes

export const STATUS: Record<StatusKey, { color: string; label: string }> = {
  green: { color: "#B6FF3B", label: "A buen ritmo" },
  yellow: { color: "#facc15", label: "Ojo, vas justo" },
  red: { color: "#FF453A", label: "Gastas demasiado rápido" },
};

export function computeSpend(txs: Tx[], rules: RecurringRule[], limit: number): SpendMetrics {
  const d = TODAY.getDate();
  const month = txs.filter((t) => t.type === "expense" && t.cat !== "ahorro" && monthKey(t.date) === monthKey(TODAY));
  const sum = (a: Tx[]) => a.reduce((x, t) => x + t.amount, 0);
  const spent = sum(month);
  const fixed = rules.filter((r) => r.type === "expense").reduce((x, r) => x + r.amount, 0); // los ingresos fijos no reservan límite
  const vBudget = Math.max(0, limit - fixed);
  const variable = month.filter((t) => !t.recurring);
  const vSpent = sum(variable);
  const vToday = sum(variable.filter((t) => t.date.getDate() === d));
  const daysLeft = DIM - d + 1;
  const leftToday = (vBudget - (vSpent - vToday)) / daysLeft - vToday;
  const expected = (vBudget * d) / DIM;
  const ratio = expected > 0 ? vSpent / expected : Infinity;
  const status = limit <= fixed || vSpent > vBudget || ratio > 1.1 ? "red" : ratio <= 0.9 ? "green" : "yellow";
  const projected = fixed + Math.round((vSpent / d) * DIM);
  let cum = 0;
  const pace = Array.from({ length: DIM }, (_, i) => {
    const day = i + 1;
    cum += sum(variable.filter((t) => t.date.getDate() === day));
    return { day, ideal: Math.round((vBudget * day) / DIM), real: day <= d ? cum : null };
  });
  return { spent, fixed, vBudget, vSpent, leftToday, expected, status, projected, pace, d };
}
