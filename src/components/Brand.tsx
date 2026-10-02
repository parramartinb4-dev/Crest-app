import { NEON } from "../lib/theme";

/** Anillo de Crest: mismo lenguaje que los anillos de actividad de las metas. */
export function Logo({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="crestRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={NEON.lime} />
          <stop offset="1" stopColor={NEON.cyan} />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
      <circle
        cx="32"
        cy="32"
        r="22"
        fill="none"
        stroke="url(#crestRing)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray="104 138"
        transform="rotate(-90 32 32)"
        style={{ filter: `drop-shadow(0 0 6px ${NEON.lime}88)` }}
      />
    </svg>
  );
}

/** Fondo negro con resplandor neón para las pantallas de acceso. */
export const GLOW_BG =
  "radial-gradient(ellipse at 50% -10%, rgba(182,255,59,0.18), transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(34,228,255,0.14), transparent 50%)";
