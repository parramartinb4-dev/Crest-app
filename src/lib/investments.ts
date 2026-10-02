import { formatEUR } from "./format";
import type { Holding, AssetView } from "./models";

const valueOf = (h: Holding): number => Math.round(h.qty * h.price);

/** Valor actual = cantidad × precio actual. */
export const totalValue = (hs: Holding[]): number => hs.reduce((s, h) => s + valueOf(h), 0);

export function toView(h: Holding): AssetView {
  const value = valueOf(h);
  const cost = Math.round(h.qty * h.avg);
  const gain = value - cost;
  // Sin histórico de precios (Fase 3: API de cotizaciones), el sparkline va del coste al valor actual.
  const spark = [{ v: cost }, { v: value }];
  const sub = [h.symbol, `${h.qty.toLocaleString("es-ES")} part.`, `PM ${formatEUR(h.avg)}`].filter(Boolean).join(" · ");
  return { ...h, value, cost, gain, pct: cost > 0 ? gain / cost : 0, sub, spark };
}
