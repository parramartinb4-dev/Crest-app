// useGrouping: "always" fuerza "1.250,50 €" también en 4 cifras. Los tipos ES2020 no lo incluyen, de ahí el cast.
const eurOptions = {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: "always",
};
const eur = new Intl.NumberFormat("es-ES", eurOptions as unknown as Intl.NumberFormatOptions);

/** Céntimos → "1.250,50 €" (toda la interfaz pasa por aquí). */
export const formatEUR = (cents: number): string => eur.format(cents / 100);

/**
 * Texto de formulario → número. Acepta "1.250,50", "1250,5" y "1250.50".
 * Con coma, la coma es el decimal y los puntos son miles. Sin coma, un punto solo
 * es decimal salvo que agrupe miles ("1.250"). Devuelve null si no es un número.
 */
export function parseDecimal(input: string): number | null {
  let t = input.trim().replace(/[^\d.,-]/g, "");
  if (t === "" || t === "-") return null;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if ((t.match(/\./g) ?? []).length > 1 || (/^\d{1,3}(\.\d{3})+$/.test(t) && !t.startsWith("0."))) t = t.replace(/\./g, "");
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Texto de formulario en euros → céntimos (null si no es válido). */
export function parseEURToCents(input: string): number | null {
  const n = parseDecimal(input);
  return n === null ? null : Math.round(n * 100);
}

export const signed = (c: number): string => (c >= 0 ? "+" : "") + formatEUR(c);
export const signedPct = (p: number): string =>
  (p >= 0 ? "+" : "") + (p * 100).toLocaleString("es-ES", { maximumFractionDigits: 1 }) + " %";

/** Céntimos → texto para un campo de formulario: 10500 → "105", 10550 → "105,50". */
export const centsToInput = (cents: number): string => (cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2).replace(".", ","));
