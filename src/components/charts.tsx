import { LineChart, Line, YAxis, ResponsiveContainer } from "recharts";
import { formatEUR } from "../lib/format";

export function ScrubTip({ active, payload }: { active?: boolean; payload?: { payload: { v: number; date: string } }[] }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/70 px-3 py-1.5 backdrop-blur-lg">
      <p className="text-sm font-extrabold tabular-nums">{formatEUR(p.v)}</p>
      <p className="text-[10px] font-semibold text-zinc-400">{p.date}</p>
    </div>
  );
}

export function Spark({ data, color }: { data: { v: number }[]; color: string }) {
  return (
    <div className="h-10 w-20 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 2, bottom: 4, left: 2 }}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
