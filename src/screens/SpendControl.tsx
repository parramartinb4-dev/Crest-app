import { useState, useEffect } from "react";
import { LineChart, Line, YAxis, ResponsiveContainer } from "recharts";
import { formatEUR } from "../lib/format";
import { NEON, FONT } from "../lib/theme";
import { DIM, STATUS, computeSpend } from "../lib/spending";
import { Card } from "../components/ui";
import { Arc } from "../components/Rings";
import type { Tx, RecurringRule } from "../lib/models";

export function SpendControl({ active, txs, rules, limit, setLimit }: { active: boolean; txs: Tx[]; rules: RecurringRule[]; limit: number; setLimit: (v: number) => void }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(active), active ? 250 : 0);
    return () => clearTimeout(t);
  }, [active]);

  const m = computeSpend(txs, rules, limit);
  const st = STATUS[m.status];
  const pct = limit > 0 ? m.spent / limit : 1;
  const Stat = ({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) => (
    <Card pad="p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums" style={{ color: color || "#fff" }}>{value}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>
    </Card>
  );

  return (
    <section>
      <h1 className="text-4xl font-black tracking-tight">Gasto</h1>
      <p className="mt-1 text-sm text-zinc-400">Tu ritmo según el día del mes</p>

      <Card className="mt-5 py-6">
        <svg viewBox="0 0 200 200" className="mx-auto w-52">
          <Arc cx={100} cy={100} r={88} stroke={20} pct={pct} color={st.color} on={on} />
          <Arc cx={100} cy={100} r={64} stroke={20} pct={m.d / DIM} color={NEON.cyan} on={on} />
          <text x="100" y="104" textAnchor="middle" fill="white" fontSize="26" fontWeight="800" fontFamily={FONT}>
            {Math.round(pct * 100)}%
          </text>
          <text x="100" y="120" textAnchor="middle" fill="#a1a1aa" fontSize="9" fontWeight="600" fontFamily={FONT}>
            DEL LÍMITE
          </text>
        </svg>
        <div className="mt-4 flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold"
          style={{ color: st.color, background: st.color + "22", width: "fit-content", margin: "16px auto 0", boxShadow: `0 0 18px ${st.color}33` }}>
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: st.color, boxShadow: `0 0 8px ${st.color}` }} />
          {st.label}
        </div>
        <p className="mt-3 px-4 text-center text-xs text-zinc-400">
          {limit <= m.fixed
            ? "Tus gastos fijos ya igualan o superan el límite."
            : `Gasto variable: ${formatEUR(m.vSpent)} · ritmo ideal a hoy: ${formatEUR(Math.round(m.expected))}`}
        </p>
        <div className="mt-3 flex justify-center gap-4 text-[11px] font-semibold text-zinc-500">
          <span><span style={{ color: st.color }}>●</span> Gastado</span>
          <span><span style={{ color: NEON.cyan }}>●</span> Mes transcurrido</span>
        </div>
      </Card>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Stat label="Hoy puedes gastar" value={formatEUR(Math.max(0, Math.round(m.leftToday)))} color={st.color}
          sub={m.leftToday < 0 ? "Ya te pasaste hoy" : `Media ideal ${formatEUR(Math.round(m.vBudget / DIM))}/día`} />
        <Stat label="Te quedan" value={formatEUR(Math.max(0, limit - m.spent))} sub={`${DIM - m.d} días más`} />
        <Stat label="Fijos reservados" value={formatEUR(m.fixed)} sub={`${rules.filter((r) => r.type === "expense").length} gastos fijos`} />
        <Stat label="Previsión de cierre" value={formatEUR(m.projected)} color={m.projected > limit ? STATUS.red.color : STATUS.green.color}
          sub={m.projected > limit ? "Superarías el límite" : "Dentro del límite"} />
      </div>

      <div data-no-swipe>
        <Card className="mt-3 flex items-center justify-between" pad="p-4">
          <div>
            <p className="text-sm font-bold">Límite mensual</p>
            <p className="text-xs text-zinc-500">Tu gasto máximo óptimo</p>
          </div>
          <div className="flex items-center gap-2">
            <button aria-label="Bajar 50 euros" onClick={() => setLimit(Math.max(0, limit - 5000))} className="h-9 w-9 rounded-full bg-white/10 text-lg font-bold">−</button>
            <div className="flex items-baseline">
              <input
                inputMode="numeric"
                value={limit / 100}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setLimit(Math.min(parseInt(e.target.value.replace(/\D/g, "") || "0", 10), 99999) * 100)}
                className="w-20 bg-transparent text-right text-xl font-black tabular-nums outline-none"
              />
              <span className="ml-1 text-lg font-black text-zinc-400">€</span>
            </div>
            <button aria-label="Subir 50 euros" onClick={() => setLimit(Math.min(9999900, limit + 5000))} className="h-9 w-9 rounded-full bg-white/10 text-lg font-bold">+</button>
          </div>
        </Card>
      </div>

      <Card className="mt-3" pad="p-4">
        <p className="text-sm font-bold">Gasto variable vs ritmo ideal</p>
        <div className="mt-2 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={m.pace} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
              <YAxis hide domain={[0, "dataMax"]} />
              <Line type="linear" dataKey="ideal" stroke="rgba(255,255,255,0.35)" strokeDasharray="4 4" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="real" stroke={st.color} strokeWidth={3} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">Línea de puntos: ritmo ideal · Línea de color: tu gasto real</p>
      </Card>
    </section>
  );
}
