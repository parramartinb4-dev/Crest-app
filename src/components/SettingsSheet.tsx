import { useEffect, useState } from "react";
import { Fingerprint, LogOut } from "lucide-react";
import { biometricEnabled, biometricSupported, disableBiometric, enableBiometric } from "../lib/biometric";
import { NEON } from "../lib/theme";
import { Sheet } from "./forms";
import { Card, Switch } from "./ui";

export function SettingsSheet({
  open,
  onClose,
  uid,
  name,
  email,
  onSignOut,
}: {
  open: boolean;
  onClose: () => void;
  uid: string;
  name: string;
  email: string;
  onSignOut: () => void;
}) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(() => biometricEnabled(uid));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void biometricSupported().then(setSupported);
  }, []);
  useEffect(() => {
    if (open) {
      setEnabled(biometricEnabled(uid));
      setMsg(null);
    }
  }, [open, uid]);

  const toggle = async (on: boolean) => {
    setMsg(null);
    if (!on) {
      disableBiometric(uid);
      setEnabled(false);
      return;
    }
    setBusy(true);
    const ok = await enableBiometric(uid, name || email);
    setBusy(false);
    if (ok) setEnabled(true);
    else setMsg("No se pudo activar. Comprueba que tu dispositivo tiene Face ID, huella o PIN configurado.");
  };

  return (
    <Sheet open={open} onClose={onClose} title="Tu cuenta" subtitle={email}>
      <div className="flex flex-1 flex-col gap-4 pt-1">
        {name && (
          <Card pad="p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Nombre</p>
            <p className="mt-0.5 text-lg font-black">{name}</p>
          </Card>
        )}

        <Card pad="p-4">
          <div className="flex items-center gap-3">
            <Fingerprint size={26} color={NEON.cyan} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Bloqueo con Face ID / huella</p>
              <p className="text-xs text-zinc-500">
                {supported
                  ? "Se pide al abrir Crest y al volver tras un rato fuera."
                  : "Disponible al abrir Crest desde una dirección segura (https) en un dispositivo con Face ID, huella o Windows Hello."}
              </p>
            </div>
            {supported && (
              <div className={busy ? "pointer-events-none opacity-50" : ""}>
                <Switch on={enabled} onChange={(v) => void toggle(v)} color={NEON.lime} />
              </div>
            )}
          </div>
          {msg && (
            <p className="mt-3 text-xs font-bold" style={{ color: NEON.pink }}>
              {msg}
            </p>
          )}
        </Card>

        <div className="mt-auto pt-2">
          <button
            onClick={onSignOut}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border text-base font-black"
            style={{ borderColor: NEON.pink + "88", color: NEON.pink }}
          >
            <LogOut size={20} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </Sheet>
  );
}
