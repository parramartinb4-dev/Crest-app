import { formatEUR, signed, signedPct } from "../lib/format";
import { NEON } from "../lib/theme";
import { toView } from "../lib/investments";
import { Card } from "../components/ui";
import { Spark } from "../components/charts";
import type { Holding } from "../lib/models";

export function Investments({ holdings, onSelect }: { holdings: Holding[]; onSelect: (h: Holding) => void }) {
  const assets = holdings.map(toView);
  const value = assets.reduce((s, a) => s + a.value, 0);
  const gain = assets.reduce((s, a) => s + a.gain, 0);
  return (
    <section>
      <h1 className="text-4xl font-black tracking-tight">Inversiones</h1>
      <p className="mt-1 text-2xl font-extrabold tabular-nums" style={{ color: NEON.lime }}>
        {formatEUR(value)}
      </p>
      <p className="text-sm font-semibold tabular-nums" style={{ color: gain >= 0 ? NEON.lime : NEON.pink }}>
        {signed(gain)} en total{assets.length > 0 ? " · toca una inversión para editarla" : ""}
      </p>
      <div className="mt-5 space-y-3">
        {assets.length === 0 && (
          <Card className="py-10 text-center text-sm text-zinc-500">Aún no tienes inversiones. Pulsa + para añadir la primera.</Card>
        )}
        {assets.map((a, i) => {
          const color = a.gain >= 0 ? NEON.lime : NEON.pink;
          return (
            <button
              type="button"
              key={a.id}
              onClick={() => onSelect(holdings[i])}
              aria-label={`Editar la inversión ${a.name}`}
              className="block w-full text-left transition-transform active:scale-[0.98]"
            >
              <Card className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold">{a.name}</p>
                <p className="truncate text-xs text-zinc-500">{a.sub}</p>
              </div>
              <Spark data={a.spark} color={color} />
              <div className="w-28 text-right">
                <p className="text-base font-extrabold tabular-nums">{formatEUR(a.value)}</p>
                <p className="text-xs font-bold tabular-nums" style={{ color }}>
                  {signedPct(a.pct)}
                </p>
              </div>
              </Card>
            </button>
          );
        })}
      </div>
    </section>
  );
}
