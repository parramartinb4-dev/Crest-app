import { useState, useEffect } from "react";
import { formatEUR } from "../lib/format";
import { daysLeftOf, paceText } from "../lib/goals";
import { Card } from "../components/ui";
import { ConcentricRings, MiniRing } from "../components/Rings";
import type { GoalView } from "../lib/models";

export function Goals({ active, goals, onSelect }: { active: boolean; goals: GoalView[]; onSelect: (g: GoalView) => void }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(active), active ? 250 : 0);
    return () => clearTimeout(t);
  }, [active]);
  return (
    <section>
      <h1 className="text-4xl font-black tracking-tight">Metas</h1>
      <p className="mt-1 text-sm text-zinc-400">Cierra tus anillos de ahorro{goals.length > 0 ? " · toca una meta para editarla" : ""}</p>
      {goals.length === 0 ? (
        <Card className="mt-5 py-10 text-center text-sm text-zinc-500">Aún no tienes metas. Pulsa + para crear la primera.</Card>
      ) : (
        <Card className="mt-5 py-7">
          <ConcentricRings goals={goals} on={on} />
          {goals.length > 4 && <p className="mt-3 text-center text-[11px] text-zinc-500">Los anillos muestran tus 4 primeras metas.</p>}
        </Card>
      )}
      <div className="mt-3 space-y-3">
        {goals.map((g) => {
          const pct = g.target > 0 ? g.saved / g.target : 0;
          return (
            <button
              type="button"
              key={g.id}
              onClick={() => onSelect(g)}
              aria-label={`Editar la meta ${g.name}`}
              className="block w-full text-left transition-transform active:scale-[0.98]"
            >
              <Card className="flex items-center gap-4">
                <MiniRing pct={pct} color={g.color} on={on} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold">{g.name}</p>
                  <p className="text-sm font-semibold tabular-nums" style={{ color: g.color }}>
                    {formatEUR(g.saved)} <span className="text-zinc-500">/ {formatEUR(g.target)}</span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {pct >= 1 ? "¡Meta conseguida!" : pct >= 0.9 ? "¡Casi lo tienes!" : paceText(g.target, g.saved, daysLeftOf(g))}
                  </p>
                </div>
                <span className="text-2xl font-black tabular-nums" style={{ color: g.color }}>
                  {Math.round(pct * 100)}%
                </span>
              </Card>
            </button>
          );
        })}
      </div>
    </section>
  );
}
