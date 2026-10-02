import { TrendingUp, Car, Dog, Activity, Package, Utensils, ArrowDownLeft, CircleDot } from "lucide-react";
import type { CategoryKey, Category } from "./models";

// Diccionario de categorías: añade palabras clave en `words` para ampliar la auto-detección.

export const CATS: Record<CategoryKey, Category> = {
  coche: { label: "Coche y transporte", icon: Car, cls: "text-cyan-400", hex: "#22d3ee", words: ["bmw", "gasolina", "peaje", "taller"] },
  mascotas: { label: "Mascotas", icon: Dog, cls: "text-pink-500", hex: "#ec4899", words: ["border collie", "pienso", "veterinario", "perro"] },
  deporte: { label: "Deporte y salud", icon: Activity, cls: "text-lime-400", hex: "#a3e635", words: ["gimnasio", "surf", "farmacia"] },
  compras: { label: "Compras", icon: Package, cls: "text-purple-400", hex: "#c084fc", words: ["kakobuy", "aduanas", "ropa", "amazon"] },
  ocio: { label: "Ocio y comida", icon: Utensils, cls: "text-orange-400", hex: "#fb923c", words: ["restaurante", "cena", "spotify"] },
  ahorro: { label: "Ahorro e inversión", icon: TrendingUp, cls: "text-yellow-400", hex: "#facc15", words: ["trade republic", "bbva", "broker"] },
  ingreso: { label: "Ingreso", icon: ArrowDownLeft, cls: "text-emerald-400", hex: "#34d399", words: [] },
  otros: { label: "Sin categoría", icon: CircleDot, cls: "text-zinc-400", hex: "#a1a1aa", words: [] },
};

export const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function detectCat(text: string): CategoryKey {
  const t = norm(text);
  for (const [key, c] of Object.entries(CATS)) if (c.words.some((w) => t.includes(w))) return key as CategoryKey;
  return "otros";
}
