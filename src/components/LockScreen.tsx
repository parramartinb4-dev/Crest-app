import { useEffect, useRef, useState } from "react";
import { Fingerprint } from "lucide-react";
import { verifyBiometric } from "../lib/biometric";
import { FONT, NEON } from "../lib/theme";
import { Logo, GLOW_BG } from "./Brand";

/** Pantalla de bloqueo: tapa la app hasta verificar cara / huella. */
export function LockScreen({ uid, onUnlock, onSignOut }: { uid: string; onUnlock: () => void; onSignOut: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const started = useRef(false);

  const attempt = async () => {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    const ok = await verifyBiometric(uid);
    setBusy(false);
    if (ok) onUnlock();
    else setMsg("No se pudo verificar. Inténtalo de nuevo.");
  };

  // Intento automático al abrir (Safari puede exigir un toque en el botón)
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void attempt();
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 px-8 text-center text-white"
      style={{ fontFamily: FONT, background: `${GLOW_BG}, #000` }}
    >
      <Logo size={72} />
      <div>
        <p className="text-3xl font-black tracking-tight">Crest</p>
        <p className="mt-1 text-sm text-zinc-400">Bloqueado</p>
      </div>
      <button
        onClick={() => void attempt()}
        disabled={busy}
        className="flex h-14 items-center gap-3 rounded-full px-7 text-base font-black text-black transition-opacity disabled:opacity-50"
        style={{ background: NEON.lime, boxShadow: `0 0 28px ${NEON.lime}55` }}
      >
        <Fingerprint size={22} />
        Desbloquear
      </button>
      {msg && (
        <p className="text-sm font-semibold" style={{ color: NEON.pink }}>
          {msg}
        </p>
      )}
      <button onClick={onSignOut} className="text-sm font-semibold text-zinc-500 underline-offset-4 hover:underline">
        Cerrar sesión
      </button>
    </div>
  );
}
