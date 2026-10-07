import { TODAY } from "./dates";
import type { Freq, RecurringRule, TxType } from "./models";

export const FREQS: Freq[] = ["weekly", "monthly", "quarterly", "yearly"];
export const FREQ_LABELS = ["Semanal", "Mensual", "Trimestral", "Anual"];
/** Cómo se pasa un cobro a "por mes" para el presupuesto. */
export const FREQ_MATH: Record<Freq, string> = { weekly: "× 52 ÷ 12", monthly: "", quarterly: "÷ 3", yearly: "÷ 12" };
export const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]; // day 1..7
const WEEKDAYS_LONG = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
export const MONTH_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTHS_LONG = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const QUARTER_PATTERNS = ["Ene·Abr·Jul·Oct", "Feb·May·Ago·Nov", "Mar·Jun·Sep·Dic"]; // month 1, 2, 3

export interface Schedule {
  freq: Freq;
  day: number;
  month: number;
}
export type Segment = Schedule & { type: TxType; amount: number; from: Date; to: Date };

/** Lo que pesa un cobro en el presupuesto mensual: trimestral ÷ 3, anual ÷ 12, semanal × 52 ÷ 12. */
export function monthlyEquivalent(amount: number, freq: Freq): number {
  switch (freq) {
    case "weekly":
      return Math.round((amount * 52) / 12);
    case "quarterly":
      return Math.round(amount / 3);
    case "yearly":
      return Math.round(amount / 12);
    default:
      return amount;
  }
}

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const parseDayKey = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Fechas en que cae el cobro entre `from` y `to` (días incluidos). */
export function occurrencesBetween(cfg: Schedule, from: Date, to: Date): Date[] {
  const out: Date[] = [];
  const a = dayStart(from).getTime();
  const b = dayStart(to).getTime();
  if (cfg.freq === "weekly") {
    for (let d = dayStart(from); d.getTime() <= b; d = addDays(d, 1)) if ((d.getDay() || 7) === cfg.day) out.push(d);
    return out;
  }
  for (let m = new Date(from.getFullYear(), from.getMonth(), 1); m.getTime() <= b; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) {
    const month = m.getMonth() + 1;
    const hit = cfg.freq === "monthly" || (cfg.freq === "yearly" ? month === cfg.month : (((month - cfg.month) % 3) + 3) % 3 === 0);
    if (!hit) continue;
    const date = new Date(m.getFullYear(), m.getMonth(), cfg.day);
    if (date.getTime() >= a && date.getTime() <= b) out.push(date);
  }
  return out;
}

/** ¿Sigue aplicándose? (los que dejaste de aplicar tienen `end` anterior a hoy) */
export const isActiveRule = (r: RecurringRule): boolean => !r.end || parseDayKey(r.end).getTime() >= dayStart(TODAY).getTime();

/**
 * Tramos de vida de un fijo: cada configuración anterior hasta su `until`, y la actual desde entonces hasta hoy
 * (o hasta `end`). Así cambiar el importe de una nómina solo afecta de ahora en adelante.
 */
export function ruleSegments(r: RecurringRule, first: Date, now: Date): Segment[] {
  const segs: Segment[] = [];
  const last = r.end ? new Date(Math.min(dayStart(now).getTime(), parseDayKey(r.end).getTime())) : dayStart(now);
  let from = dayStart(first);
  const past = [...(r.past ?? [])].sort((x, y) => x.until.localeCompare(y.until));
  for (const p of past) {
    const to = parseDayKey(p.until);
    if (to.getTime() >= from.getTime() && to.getTime() <= last.getTime()) segs.push({ ...p, from, to });
    const next = addDays(to, 1);
    if (next.getTime() > from.getTime()) from = next;
  }
  if (from.getTime() <= last.getTime()) segs.push({ type: r.type, amount: r.amount, freq: r.freq, day: r.day, month: r.month, from, to: last });
  return segs;
}

/** Próxima fecha en que se aplicará (null si ya no se aplica). */
export function nextOccurrence(r: RecurringRule, from: Date = TODAY): Date | null {
  if (!isActiveRule(r)) return null;
  return occurrencesBetween(r, from, addDays(from, 800))[0] ?? null;
}

export function scheduleText(s: Schedule): string {
  switch (s.freq) {
    case "weekly":
      return `Cada ${WEEKDAYS_LONG[s.day - 1] ?? "semana"}`;
    case "quarterly":
      return `Cada 3 meses · día ${s.day} (${QUARTER_PATTERNS[s.month - 1] ?? ""})`;
    case "yearly":
      return `Cada año · ${s.day} de ${MONTHS_LONG[s.month - 1] ?? ""}`;
    default:
      return `Día ${s.day} de cada mes`;
  }
}
