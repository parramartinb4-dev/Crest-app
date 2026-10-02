import { formatEUR, parseDecimal } from "./format";
import type { GoalView } from "./models";

export const DAY_MS = 864e5;
const MONTH_DAYS = 30.4375;
const YEAR_DAYS = 365.25;

export const UNIT_NAMES = ["Días", "Semanas", "Meses", "Años"];
const UNIT_DAYS = [1, 7, MONTH_DAYS, YEAR_DAYS];

export function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

/** Días que faltan hasta una fecha (0 o negativo = ya venció). */
export const daysUntil = (deadline: Date, from: Date = new Date()): number => Math.ceil((deadline.getTime() - from.getTime()) / DAY_MS);

/** Meses aproximados para un número de días (mínimo 1). */
export const monthsFromDays = (days: number): number => Math.max(1, Math.round(days / MONTH_DAYS));

export const formatDate = (d: Date): string => d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

/**
 * "N unidades desde hoy" → fecha límite. Acepta decimales ("1,5" años).
 * Devuelve null si no es un plazo válido (de 1 día a 50 años).
 * unit: 0 días · 1 semanas · 2 meses · 3 años
 */
export function termToDeadline(amount: string, unit: number, from: Date = new Date()): Date | null {
  const n = parseDecimal(amount);
  if (n === null || n <= 0) return null;
  let d: Date;
  if (unit === 2 && Number.isInteger(n)) d = addMonths(from, n); // meses enteros: calendario real
  else if (unit === 3 && Number.isInteger(n)) d = addMonths(from, n * 12);
  else d = new Date(from.getTime() + Math.round(n * UNIT_DAYS[unit]) * DAY_MS);
  // de 1 día a 50 años (calendario real); si d no es una fecha válida, las comparaciones dan false
  return daysUntil(d, from) >= 1 && d.getTime() <= addMonths(from, 600).getTime() ? d : null;
}

/** Cómo mostrar un plazo que queda: elige la unidad que mejor lo expresa. */
export function suggestTerm(days: number): { amount: string; unit: number } {
  if (days < 14) return { amount: String(Math.max(1, days)), unit: 0 };
  if (days < 70) return { amount: String(Math.round(days / 7)), unit: 1 };
  if (days < 730) return { amount: String(Math.round(days / MONTH_DAYS)), unit: 2 };
  return { amount: String(Math.round((days / YEAR_DAYS) * 10) / 10).replace(".", ","), unit: 3 };
}

export function daysLeftOf(g: GoalView): number {
  return g.deadline ? daysUntil(new Date(g.deadline)) : Math.round(g.monthsLeft * MONTH_DAYS);
}

/** Cuánto ahorrar para llegar a tiempo: por día, semana o mes según lo cerca que esté la fecha. */
export function paceText(target: number, saved: number, days: number): string {
  const left = Math.max(0, target - saved);
  if (left === 0) return "¡Meta conseguida!";
  if (days <= 0) return `Plazo vencido · te faltan ${formatEUR(left)}`;
  if (days <= 14) return `Ahorra ${formatEUR(Math.ceil(left / days))}/día para llegar a tiempo`;
  if (days <= 90) return `Ahorra ${formatEUR(Math.ceil(left / Math.max(1, Math.round(days / 7))))}/semana para llegar a tiempo`;
  return `Ahorra ${formatEUR(Math.ceil(left / monthsFromDays(days)))}/mes para llegar a tiempo`;
}
