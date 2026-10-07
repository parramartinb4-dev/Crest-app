import type { LucideIcon } from "lucide-react";

export type TabId = "patrimonio" | "cuentas" | "inversiones" | "metas" | "gasto";
export type TxType = "expense" | "income";
export type PayMethod = "card" | "account"; // solo etiqueta: ambas restan del mismo saldo
export type CategoryKey = "coche" | "mascotas" | "deporte" | "compras" | "ocio" | "ahorro" | "ingreso" | "otros";
export type StatusKey = "green" | "yellow" | "red";

export interface Category {
  label: string;
  icon: LucideIcon;
  cls: string; // clase Tailwind del icono
  hex: string; // mismo color para el resplandor
  words: string[];
}
/** Importes siempre en céntimos. */
export interface Tx {
  id: string;
  name: string;
  amount: number;
  type: TxType;
  cat: CategoryKey;
  method: PayMethod;
  date: Date;
  recurring?: boolean;
  ruleId?: string; // si viene de un gasto/ingreso fijo: cuál
  freq?: Freq; // y con qué frecuencia se aplicó
}
export type Freq = "weekly" | "monthly" | "quarterly" | "yearly";

/** Configuración anterior de un fijo: se aplicó hasta `until` (incluido, "2026-09-30"). */
export interface RuleVersion {
  until: string;
  type: TxType;
  amount: number;
  freq: Freq;
  day: number;
  month: number;
}

export interface RecurringRule {
  id: string;
  type: TxType; // "expense" = gasto fijo, "income" = ingreso fijo (nómina, alquiler que cobras...)
  name: string;
  amount: number; // importe de CADA cobro (no el equivalente mensual)
  freq: Freq;
  /** Semanal: día de la semana (1 lunes … 7 domingo). Resto: día del mes (1-28). */
  day: number;
  /** Trimestral: 1, 2 o 3 (cobra ese mes y cada 3 meses). Anual: mes del cobro (1-12). Resto: 1. */
  month: number;
  method: PayMethod;
  cat: CategoryKey;
  start?: string; // mes en que se creó ("2026-09"): los cobros empiezan ahí
  end?: string; // si lo dejaste de aplicar: último día en que contó ("2026-10-01")
  past?: RuleVersion[]; // configuraciones anteriores: así un cambio de importe vale desde hoy y no reescribe el pasado
}
export type NewRule = Omit<RecurringRule, "id" | "start" | "end" | "past">;
export type EditingEntry = { kind: "tx"; tx: Tx } | { kind: "rule"; rule: RecurringRule };
export interface NewTxInput {
  type: TxType;
  amount: number;
  name: string;
  method: PayMethod;
  fixed: boolean;
  day: number;
  freq: Freq;
  month: number;
  date?: Date; // solo al editar un movimiento
  retro?: boolean; // solo al editar un fijo: aplicar el cambio a todo el historial
}
export interface GoalView {
  id: string;
  name: string;
  saved: number;
  target: number;
  monthsLeft: number; // meses que quedaban al crearla
  deadline?: string; // fecha límite ISO (metas nuevas): permite recalcular los meses que faltan
  color: string;
  createdAt?: number;
}
export interface NewGoalInput {
  name: string;
  target: number;
  saved: number;
  deadline: string; // fecha límite en ISO
  color: string;
}

/** Inversión guardada. Precios en céntimos POR participación. */
export interface Holding {
  id: string;
  name: string;
  symbol: string; // ticker o ISIN
  qty: number; // participaciones (admite decimales)
  avg: number; // precio medio de compra
  price: number; // precio actual (lo edita el usuario en el MVP)
  createdAt?: number;
}
export type NewHoldingInput = Pick<Holding, "name" | "symbol" | "qty" | "avg" | "price">;

/** Inversión lista para pintar (valores derivados, nunca se guardan). */
export interface AssetView extends Holding {
  value: number;
  cost: number;
  gain: number;
  pct: number;
  sub: string;
  spark: { v: number }[];
}
export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
}
export interface SpendMetrics {
  spent: number;
  fixed: number;
  vBudget: number;
  vSpent: number;
  leftToday: number;
  expected: number;
  status: StatusKey;
  projected: number;
  pace: { day: number; ideal: number; real: number | null }[];
  d: number;
}

/** Perfil guardado en users/{uid}. Importes en céntimos. */
export interface Profile {
  name: string;
  email: string;
  onboarded: boolean;
  mainStart: number; // saldo de la cuenta principal el día del alta
  balanceSince: Date; // desde cuándo cuenta ese saldo: solo lo posterior lo modifica
  limit: number; // límite de gasto mensual
}

/** Un punto de la gráfica de crecimiento (una foto del patrimonio por día). */
export interface HistoryPoint {
  day: string; // "2026-09-30"
  date: string; // etiqueta para el tooltip ("30 sept")
  v: number;
}
