import { Plus } from "lucide-react";
import { NEON } from "../lib/theme";

export function Fab({ visible, onClick, label = "Nuevo movimiento" }: { visible: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="absolute bottom-24 right-5 z-30 flex h-16 w-16 items-center justify-center rounded-full text-black transition-all duration-300"
      style={{
        background: NEON.lime,
        boxShadow: `0 0 28px ${NEON.lime}88`,
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.6)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <span className="absolute inset-0 animate-ping rounded-full opacity-25" style={{ background: NEON.lime }} />
      <Plus size={32} strokeWidth={3} className="relative" />
    </button>
  );
}
