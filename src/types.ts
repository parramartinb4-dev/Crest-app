/**
 * Modelo de datos del MVP.
 * Convención: todo el dinero se guarda en CÉNTIMOS (enteros) para evitar
 * errores de coma flotante. Las fechas van en ISO 8601 (string).
 */

export type ID = string;
export type ISODate = string; // "2026-09-24"
export type Cents = number;

/* ───────── Cuentas ───────── */

export type AccountType = "checking" | "savings" | "cash";

export interface Account {
  id: ID;
  name: string; // "BBVA Nómina"
  institution?: string; // "BBVA", "La Caixa"...
  type: AccountType;
  currency: "EUR";
  /** Saldo estático a la fecha de arranque. Saldo actual = initialBalance + transacciones posteriores */
  initialBalance: Cents;
  initialBalanceDate: ISODate;
  archived?: boolean;
}

/* ───────── Transacciones ───────── */

export type TransactionType = "income" | "expense";

export interface Category {
  id: ID;
  name: string; // "Comida", "Ocio", "Nómina"
  type: TransactionType;
  icon?: string;
}

export interface Transaction {
  id: ID;
  accountId: ID;
  type: TransactionType;
  amount: Cents; // siempre positivo; el signo lo da `type`
  date: ISODate;
  categoryId?: ID; // opcional para poder registrar en 2 toques
  note?: string;
  /** Fase 2: distingue lo manual de lo importado por CSV */
  source: "manual" | "csv";
  importBatchId?: ID;
}

/** Fase 2: importación de CSV del banco */
export interface CsvImportBatch {
  id: ID;
  accountId: ID;
  fileName: string;
  importedAt: ISODate;
  rowCount: number;
  /** Mapeo de columnas del CSV, distinto en cada banco */
  columnMap: { date: string; amount: string; description: string };
}

export interface CategoryRule {
  id: ID;
  /** Si la descripción contiene este texto → asigna la categoría */
  match: string;
  categoryId: ID;
}

/* ───────── Inversiones ───────── */

export type AssetType = "fund" | "stock" | "etf" | "savings_account" | "other";

export interface Asset {
  id: ID;
  /** Ticker (AAPL) o ISIN (ES0113211835). Clave para la API de la Fase 2 */
  symbol: string;
  name: string;
  institution?: string; // "BBVA", "La Caixa"
  type: AssetType;
  currency: "EUR";
  quantity: number; // participaciones (admite decimales)
  avgBuyPrice: Cents; // precio medio de compra POR participación
  /** Precio actual POR participación. Valor actual = quantity * currentPrice */
  currentPrice: Cents;
  priceSource: "manual" | "api";
  priceUpdatedAt: ISODate;
}

/** Histórico para ver la evolución (un registro por cierre de mes) */
export interface PriceSnapshot {
  assetId: ID;
  date: ISODate;
  price: Cents;
}

/** Fase 2: contrato que cumplirá cualquier proveedor (Yahoo, Alpha Vantage...) */
export interface PriceProvider {
  name: string;
  getPrice(symbol: string): Promise<{ price: Cents; asOf: ISODate }>;
}

/* ───────── Deudas, metas y presupuesto ───────── */

export interface Debt {
  id: ID;
  name: string;
  balance: Cents; // pendiente de pagar
  monthlyPayment?: Cents;
}

export interface Goal {
  id: ID;
  name: string; // "Fondo de emergencia"
  target: Cents;
  saved: Cents;
  deadline?: ISODate;
  linkedAccountId?: ID;
}

export interface MonthlyBudget {
  month: string; // "2026-09"
  limit: Cents; // límite de gasto mensual
}

/* ───────── Estado global ───────── */

export interface AppData {
  version: 1;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  assets: Asset[];
  snapshots: PriceSnapshot[];
  debts: Debt[];
  goals: Goal[];
  budgets: MonthlyBudget[];
}

/* ───────── Cálculos derivados (nunca se guardan) ───────── */

export const assetValue = (a: Asset): Cents => Math.round(a.quantity * a.currentPrice);
export const assetCost = (a: Asset): Cents => Math.round(a.quantity * a.avgBuyPrice);
export const assetGain = (a: Asset): Cents => assetValue(a) - assetCost(a);

export function accountBalance(acc: Account, txs: Transaction[]): Cents {
  return txs
    .filter((t) => t.accountId === acc.id && t.date >= acc.initialBalanceDate)
    .reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), acc.initialBalance);
}

export function netWorth(d: AppData): Cents {
  const cash = d.accounts.reduce((s, a) => s + accountBalance(a, d.transactions), 0);
  const invested = d.assets.reduce((s, a) => s + assetValue(a), 0);
  const debt = d.debts.reduce((s, x) => s + x.balance, 0);
  return cash + invested - debt;
}
