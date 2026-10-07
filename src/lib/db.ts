import { Timestamp, collection, doc, writeBatch } from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import { db } from "./firebase";
import { CATS } from "./categories";
import { daysUntil, monthsFromDays } from "./goals";
import { toDayKey } from "./transactions";
import type { CategoryKey, Freq, GoalView, Holding, NewGoalInput, NewHoldingInput, NewRule, Profile, RecurringRule, RuleVersion, Tx } from "./models";

/*
 * Estructura en Firestore (todo cuelga del uid del usuario, que es lo que protegen las reglas):
 *   users/{uid}                    perfil: nombre, saldo inicial, límite mensual...
 *   users/{uid}/transactions/{id}  ingresos y gastos
 *   users/{uid}/rules/{id}         gastos e ingresos fijos mensuales
 *   users/{uid}/holdings/{id}      inversiones
 *   users/{uid}/goals/{id}         metas de ahorro
 *   users/{uid}/snapshots/{día}    foto diaria del patrimonio (gráfica de crecimiento)
 * Los importes son siempre enteros en céntimos.
 */

const clip = (s: string, max: number) => s.trim().slice(0, max);

/* ───────── Qué se escribe (los campos coinciden con firestore.rules) ───────── */

export const txDoc = (t: Omit<Tx, "id" | "recurring">): DocumentData => ({
  name: clip(t.name, 120),
  amount: t.amount,
  type: t.type,
  cat: t.cat,
  method: t.method,
  date: t.date,
});

/** Campos editables de un fijo. `past` guarda las configuraciones anteriores (ver RuleVersion). */
export const rulePatch = (r: NewRule, past: RuleVersion[]): DocumentData => ({
  type: r.type,
  name: clip(r.name, 120),
  amount: r.amount,
  freq: r.freq,
  day: r.day,
  month: r.month,
  method: r.method,
  cat: r.cat,
  past,
});

export const ruleDoc = (r: NewRule, start: string): DocumentData => ({ ...rulePatch(r, []), start });

/**
 * Historial al modificar un fijo. Si cambia el importe, la frecuencia o el día, la configuración anterior queda
 * cerrada en el día de ayer y la nueva vale desde hoy (el pasado no se reescribe). `retro` = corregir un error:
 * el cambio se aplica a todo el historial.
 */
export function nextPast(old: RecurringRule, next: NewRule, retro: boolean): RuleVersion[] {
  const past = old.past ?? [];
  const changed = old.type !== next.type || old.amount !== next.amount || old.freq !== next.freq || old.day !== next.day || old.month !== next.month;
  if (retro || !changed) return past;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const snapshot: RuleVersion = { until: toDayKey(yesterday), type: old.type, amount: old.amount, freq: old.freq, day: old.day, month: old.month };
  return [...past, snapshot].slice(-40);
}

export const holdingPatch = (h: NewHoldingInput): DocumentData => ({
  name: clip(h.name, 120),
  symbol: clip(h.symbol, 40),
  qty: h.qty,
  avg: h.avg,
  price: h.price,
});

export const holdingDoc = (h: NewHoldingInput): DocumentData => ({ ...holdingPatch(h), createdAt: Date.now() });

/** Campos editables de una meta (sirve para crear y para modificar). */
export const goalPatch = (g: NewGoalInput): DocumentData => ({
  name: clip(g.name, 120),
  saved: g.saved,
  target: g.target,
  monthsLeft: monthsFromDays(daysUntil(new Date(g.deadline))), // aproximado; lo que manda es deadline
  deadline: g.deadline,
  color: clip(g.color, 20),
});

export const goalDoc = (g: NewGoalInput): DocumentData => ({ ...goalPatch(g), createdAt: Date.now() });

export const snapshotDoc = (day: string, v: number): DocumentData => ({ day, v });

export interface OnboardingData {
  name: string;
  email: string;
  mainStart: number;
  limit: number;
  goal?: NewGoalInput;
}

export const profileDoc = (p: OnboardingData): DocumentData => {
  const since = new Date();
  since.setHours(0, 0, 0, 0); // el saldo inicial cuenta desde el principio de hoy
  return {
    name: clip(p.name, 60),
    email: clip(p.email, 254),
    onboarded: true,
    mainStart: p.mainStart,
    balanceSince: since,
    limit: p.limit,
    createdAt: Date.now(),
  };
};

/** Guarda el perfil (y la primera meta, si la hay) en una sola operación. */
export async function completeOnboarding(uid: string, p: OnboardingData): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, "users", uid), profileDoc(p));
  if (p.goal) batch.set(doc(collection(db, "users", uid, "goals")), goalDoc(p.goal));
  await batch.commit();
}

/* ───────── Cómo se lee ───────── */

const toDate = (v: unknown): Date => (v instanceof Timestamp ? v.toDate() : new Date());

export function toProfile(d: DocumentData): Profile {
  return {
    name: String(d.name ?? ""),
    email: String(d.email ?? ""),
    onboarded: d.onboarded === true,
    mainStart: Number(d.mainStart ?? 0),
    balanceSince: toDate(d.balanceSince),
    limit: Number(d.limit ?? 120000),
  };
}

export const toTx = (id: string, d: DocumentData): Tx => ({
  id,
  name: String(d.name ?? ""),
  amount: Number(d.amount ?? 0),
  type: d.type === "income" ? "income" : "expense",
  cat: (d.cat in CATS ? d.cat : "otros") as CategoryKey,
  method: d.method === "account" ? "account" : "card",
  date: toDate(d.date),
});

const freqOf = (v: unknown): Freq => (v === "weekly" || v === "quarterly" || v === "yearly" ? v : "monthly");

const toVersion = (p: DocumentData): RuleVersion => ({
  until: String(p.until ?? ""),
  type: p.type === "income" ? "income" : "expense",
  amount: Number(p.amount ?? 0),
  freq: freqOf(p.freq),
  day: Number(p.day ?? 1),
  month: Number(p.month ?? 1),
});

export const toRule = (id: string, d: DocumentData): RecurringRule => ({
  id,
  type: d.type === "income" ? "income" : "expense", // las reglas antiguas no tenían tipo: eran gastos
  name: String(d.name ?? ""),
  amount: Number(d.amount ?? 0),
  freq: freqOf(d.freq), // las reglas antiguas no tenían frecuencia: eran mensuales
  day: Number(d.day ?? 1),
  month: Number(d.month ?? 1),
  method: d.method === "account" ? "account" : "card",
  cat: (d.cat in CATS ? d.cat : "otros") as CategoryKey,
  start: typeof d.start === "string" ? d.start : undefined,
  end: typeof d.end === "string" ? d.end : undefined,
  past: Array.isArray(d.past) ? (d.past as DocumentData[]).map(toVersion) : [],
});

export const toHolding = (id: string, d: DocumentData): Holding => ({
  id,
  name: String(d.name ?? ""),
  symbol: String(d.symbol ?? ""),
  qty: Number(d.qty ?? 0),
  avg: Number(d.avg ?? 0),
  price: Number(d.price ?? 0),
  createdAt: typeof d.createdAt === "number" ? d.createdAt : 0,
});

export const toGoal = (id: string, d: DocumentData): GoalView => ({
  id,
  name: String(d.name ?? ""),
  saved: Number(d.saved ?? 0),
  target: Number(d.target ?? 0),
  monthsLeft: Number(d.monthsLeft ?? 1),
  deadline: typeof d.deadline === "string" ? d.deadline : undefined,
  color: String(d.color ?? "#B6FF3B"),
  createdAt: typeof d.createdAt === "number" ? d.createdAt : 0,
});

/** Mensaje en castellano para los errores de Firestore más habituales. */
export function describeFirestoreError(e: unknown): string {
  const code = (e as { code?: string } | null)?.code ?? "";
  if (code === "permission-denied") {
    return "Firestore ha rechazado la operación por permisos. ¿Has publicado las reglas (firestore.rules) en tu proyecto?";
  }
  if (code === "unavailable") return "Sin conexión con el servidor. Tus cambios se guardarán cuando vuelva.";
  return "No se pudo sincronizar con la nube. Inténtalo de nuevo.";
}
