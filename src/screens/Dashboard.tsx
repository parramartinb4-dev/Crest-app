import { useState } from "react";
import { AreaChart, Area, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { formatEUR, signedPct } from "../lib/format";
import { NEON } from "../lib/theme";
import { Card } from "../components/ui";
import { ScrubTip } from "../components/charts";
import type { HistoryPoint } from "../lib/models";

const VIEWS = ["Crecimiento", "Composición"];

export function Dashboard({ cash, invest, history }: { cash: number; invest: number; history: HistoryPoint[] }) {
  const [view, setView] = useState(0);
  const total = cash + invest;
  const rows: [string, number, string][] = [
    ["Cuentas", cash, NEON.cyan],
    ["Inversiones", invest, NEON.lime],
  ];

  // Variación desde el primer día guardado
  const first = history[0];
  const change = history.length >= 2 && first.v > 0 ? total / first.v - 1 : null;

  // Margen de la gráfica proporcional a lo que hay (funciona igual con 50 € que con 50.000 €)
  const values = history.map((p) => p.v);
  const lo = values.length ? Math.min(...values) : 0;
  const hi = values.length ? Math.max(...values) : 0;
  const pad = Math.max((hi - lo) * 0.2, hi * 0.01, 100);

  // Composición de lo que tienes
  const parts = [
    { name: "Cuentas", value: Math.max(0, cash), color: NEON.cyan as string },
    { name: "Inversiones", value: Math.max(0, invest), color: NEON.lime as string },
  ];
  const partsTotal = parts.reduce((s, p) => s + p.value, 0);
  const pieData = partsTotal > 0 ? parts : [{ name: "Vacío", value: 1, color: "#27272a" }];

  return (
    <section>
      <div
        className="rounded-3xl px-1 pb-8 pt-4"
        style={{ background: "radial-gradient(ellipse at 20% 0%, rgba(34,228,255,0.18), transparent 60%)" }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Patrimonio neto</p>
        <p className="mt-2 text-6xl font-black leading-none tracking-tighter">{formatEUR(total)}</p>
        {change !== null && (
          <p className="mt-3 text-sm font-semibold" style={{ color: change >= 0 ? NEON.lime : NEON.pink }}>
            {change >= 0 ? "▲" : "▼"} {signedPct(change)} desde el {first.date}
          </p>
        )}

        {/* Interruptor Crecimiento / Composición */}
        <div data-no-swipe className="relative mt-5 grid w-full max-w-[300px] grid-cols-2 rounded-full bg-white/10 p-1">
          <span
            className="absolute inset-y-1 left-1 rounded-full bg-white"
            style={{
              width: "calc(50% - 4px)",
              transform: view === 1 ? "translateX(100%)" : "none",
              transition: "transform 320ms cubic-bezier(.22,1,.36,1)",
            }}
          />
          {VIEWS.map((label, i) => (
            <button
              key={label}
              onClick={() => setView(i)}
              className="relative z-10 py-1.5 text-sm font-bold transition-colors duration-300"
              style={{ color: view === i ? "#000" : "#a1a1aa" }}
            >
              {label}
            </button>
          ))}
        </div>

        {view === 0 ? (
          history.length < 2 ? (
            <div key="empty" className="fade-in mt-4 flex h-44 items-center justify-center rounded-2xl bg-white/5 px-6 text-center text-sm text-zinc-400">
              Tu gráfica de crecimiento empezará a dibujarse mañana, cuando Crest tenga dos días guardados.
            </div>
          ) : (
            /* pan-y: el gesto horizontal es para el tooltip; el vertical sigue haciendo scroll */
            <div key="growth" data-no-swipe className="fade-in -mx-5 mt-4 h-44" style={{ touchAction: "pan-y" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="nwFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={NEON.lime} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={NEON.lime} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <YAxis hide domain={[lo - pad, hi + pad]} />
                  <Tooltip
                    content={<ScrubTip />}
                    cursor={{ stroke: "rgba(255,255,255,0.25)", strokeWidth: 1 }}
                    isAnimationActive={false}
                    wrapperStyle={{ outline: "none" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={NEON.lime}
                    strokeWidth={3}
                    fill="url(#nwFill)"
                    activeDot={{ r: 5, fill: NEON.lime, stroke: "#000", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )
        ) : (
          <div key="mix" className="fade-in mt-4 flex h-44 items-center gap-4 px-1">
            <div className="relative h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="68%"
                    outerRadius="100%"
                    paddingAngle={parts.every((p) => p.value > 0) ? 4 : 0}
                    cornerRadius={8}
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {pieData.map((p) => (
                      <Cell key={p.name} fill={p.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Activos</span>
                <span className="text-base font-black tabular-nums tracking-tight">{formatEUR(partsTotal)}</span>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              {parts.map((p) => (
                <div key={p.name}>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color, boxShadow: `0 0 8px ${p.color}` }} />
                    <span className="truncate text-sm font-semibold text-zinc-300">{p.name}</span>
                    <span className="ml-auto text-sm font-black tabular-nums" style={{ color: p.color }}>
                      {partsTotal > 0 ? Math.round((p.value / partsTotal) * 100) : 0} %
                    </span>
                  </div>
                  <p className="pl-[18px] text-xs tabular-nums text-zinc-500">{formatEUR(p.value)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="space-y-3">
        {rows.map(([label, cents, color]) => (
          <Card key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
              <span className="text-base font-semibold text-zinc-300">{label}</span>
            </div>
            <span className="text-xl font-black tabular-nums" style={{ color }}>
              {formatEUR(cents)}
            </span>
          </Card>
        ))}
      </div>
    </section>
  );
}
