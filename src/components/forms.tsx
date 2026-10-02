import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

export const inputCls =
  "w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base font-semibold text-white outline-none placeholder:font-medium placeholder:text-zinc-500 focus:border-white/30";

/** Hoja emergente de cristal que sube desde abajo (mismo estilo que el alta de movimientos). */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        style={{ zIndex: 55, opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-hidden={!open}
        className="absolute inset-x-0 bottom-0 mx-auto flex max-w-md flex-col rounded-t-3xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl"
        style={{
          zIndex: 60,
          maxHeight: "92%",
          transform: open ? "translateY(0)" : "translateY(105%)",
          visibility: open ? "visible" : "hidden",
          transition: `transform 420ms cubic-bezier(.22,1,.36,1), visibility 0s linear ${open ? "0s" : "420ms"}`,
        }}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/20" />
        <div className="flex shrink-0 items-start justify-between px-5 pb-3 pt-3">
          <div>
            <p className="text-xl font-black tracking-tight">{title}</p>
            {subtitle && <p className="text-xs font-semibold text-zinc-500">{subtitle}</p>}
          </div>
          <button aria-label="Cerrar" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
            <X size={18} />
          </button>
        </div>
        <div className="no-sb flex flex-1 flex-col overflow-y-auto overscroll-contain px-5 pb-6">{children}</div>
      </div>
    </>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block pl-1 text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

/** Campo numérico con sufijo € (teclado decimal en el móvil). */
export function MoneyInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputCls} pr-9 tabular-nums`}
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-base font-bold text-zinc-500">€</span>
    </div>
  );
}
