import type { ReactNode } from "react";
import type { Category } from "../lib/models";

export function Card({ children, className = "", pad = "p-5" }: { children: ReactNode; className?: string; pad?: string }) {
  return <div className={`rounded-3xl bg-zinc-900/50 ${pad} ${className}`}>{children}</div>;
}

export const Heading = ({ children }: { children: ReactNode }) => (
  <p className="mb-3 mt-8 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">{children}</p>
);

export function Switch({ on, onChange, color }: { on: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200"
      style={{ background: on ? color : "rgba(255,255,255,0.15)" }}
    >
      <span className="absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all duration-200" style={{ left: on ? 28 : 4 }} />
    </button>
  );
}

export function CatIcon({ cat, size = 44 }: { cat: Category; size?: number }) {
  const Icon = cat.icon;
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-black transition-all duration-300"
      style={{ width: size, height: size, border: `2px solid ${cat.hex}66`, boxShadow: `0 0 14px ${cat.hex}55, inset 0 0 10px ${cat.hex}22` }}
    >
      <Icon size={Math.round(size * 0.45)} className={cat.cls} strokeWidth={2.4} />
    </span>
  );
}

/** Interruptor segmentado estilo iOS con píldora deslizante. */
export function Segmented({ options, value, onChange }: { options: string[]; value: number; onChange: (i: number) => void }) {
  return (
    <div className="relative grid rounded-full bg-white/10 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      <span
        className="absolute inset-y-1 left-1 rounded-full bg-white"
        style={{
          width: `calc((100% - 8px) / ${options.length})`,
          transform: `translateX(${value * 100}%)`,
          transition: "transform 320ms cubic-bezier(.22,1,.36,1)",
        }}
      />
      {options.map((label, i) => (
        <button
          type="button"
          key={label}
          onClick={() => onChange(i)}
          className="relative z-10 py-2 text-sm font-bold transition-colors duration-300"
          style={{ color: value === i ? "#000" : "#a1a1aa" }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
