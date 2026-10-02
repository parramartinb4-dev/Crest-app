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
}
export interface RecurringRule {
  id: string;
  type: TxType; // "expense" = gasto fijo, "income" = ingreso fijo (nómina, alquiler que cobras...)
  name: string;
  amount: number;
  day: number; // 1-28
  method: PayMethod;
  cat: CategoryKey;
  start?: string; // mes en que se creó ("2026-09"): los cobros empiezan ahí
}
export interface NewTxInput {
  type: TxType;
  amount: number;
  name: string;
  method: PayMethod;
  fixed: boolean;
  day: number;
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
