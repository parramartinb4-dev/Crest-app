import { FONT } from "../lib/theme";
import type { GoalView } from "../lib/models";

export function Arc({ cx, cy, r, stroke, pct, color, on }: { cx: number; cy: number; r: number; stroke: number; pct: number; color: string; on: boolean }) {
  const C = 2 * Math.PI * r;
  const p = on ? Math.min(pct, 1) : 0;
  return (
    <g transform={`rotate(-90 ${cx} ${cy})`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeOpacity="0.22" strokeWidth={stroke} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C * (1 - p)}
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)", filter: `drop-shadow(0 0 6px ${color}66)` }}
      />
    </g>
  );
}

export function ConcentricRings({ goals, on }: { goals: GoalView[]; on: boolean }) {
  const shown = goals.slice(0, 4); // el gráfico admite hasta 4 anillos; la lista muestra todas
  const many = shown.length > 3;
  const stroke = many ? 15 : 20;
  const gap = many ? 19 : 24;
  const ratio = (g: GoalView) => (g.target > 0 ? g.saved / g.target : 0);
  const avg = shown.length ? shown.reduce((s, g) => s + ratio(g), 0) / shown.length : 0;
  return (
    <svg viewBox="0 0 200 200" className="mx-auto w-56">
      {shown.map((g, i) => (
        <Arc key={g.id} cx={100} cy={100} r={88 - i * gap} stroke={stroke} pct={ratio(g)} color={g.color} on={on} />
      ))}
      <text x="100" y="104" textAnchor="middle" fill="white" fontSize={many ? 18 : 22} fontWeight="800" fontFamily={FONT}>
        {Math.round(avg * 100)}%
      </text>
      <text x="100" y="120" textAnchor="middle" fill="#a1a1aa" fontSize="9" fontWeight="600" fontFamily={FONT}>
        MEDIA
      </text>
    </svg>
  );
}

export function MiniRing({ pct, color, on }: { pct: number; color: string; on: boolean }) {
  return (
    <svg viewBox="0 0 60 60" className="h-14 w-14 shrink-0">
      <Arc cx={30} cy={30} r={22} stroke={9} pct={pct} color={color} on={on} />
    </svg>
  );
}
