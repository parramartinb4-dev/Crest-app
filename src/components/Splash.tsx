import { FONT, NEON } from "../lib/theme";
import { Logo, GLOW_BG } from "./Brand";

const shell = { fontFamily: FONT, minHeight: "100dvh", background: `${GLOW_BG}, #000` } as const;

export function Splash({ slow = false }: { slow?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-8 text-center text-white" style={shell}>
      <div className="animate-pulse">
        <Logo size={72} />
      </div>
      {slow && <p className="max-w-xs text-sm text-zinc-400">Conectando con tu cuenta… Si tarda, comprueba tu conexión.</p>}
    </div>
  );
}

export function ErrorScreen({ message, onSignOut }: { message: string; onSignOut: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 px-8 text-center text-white" style={shell}>
      <Logo size={56} />
      <p className="max-w-sm text-base font-bold" style={{ color: NEON.pink }}>
        {message}
      </p>
      <div className="flex gap-3">
        <button onClick={() => window.location.reload()} className="rounded-full px-5 py-2.5 text-sm font-black text-black" style={{ background: NEON.lime }}>
          Reintentar
        </button>
        <button onClick={onSignOut} className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
