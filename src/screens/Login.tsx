import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { authMessage, resetPassword, signIn, signUp } from "../lib/auth";
import { FONT, NEON } from "../lib/theme";
import { Field, inputCls } from "../components/forms";
import { Segmented } from "../components/ui";
import { Logo, GLOW_BG } from "../components/Brand";

export function Login() {
  const [mode, setMode] = useState(0); // 0 = entrar, 1 = crear cuenta
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const register = mode === 1;
  const emailOk = /\S+@\S+\.\S+/.test(email);
  const valid = emailOk && pass.length >= (register ? 8 : 1);

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (register) await signUp(email, pass);
      else await signIn(email, pass);
    } catch (e) {
      setError(authMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    setError(null);
    setInfo(null);
    if (!emailOk) {
      setError("Escribe tu correo arriba y pulsa de nuevo.");
      return;
    }
    try {
      await resetPassword(email);
      setInfo("Si existe una cuenta con ese correo, te hemos enviado un enlace para crear una contraseña nueva.");
    } catch (e) {
      setError(authMessage(e));
    }
  };

  return (
    <div className="flex items-center justify-center px-6 py-10 text-white" style={{ fontFamily: FONT, minHeight: "100dvh", background: `${GLOW_BG}, #000` }}>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={76} />
          <h1 className="mt-4 text-5xl font-black tracking-tighter">Crest</h1>
          <p className="mt-2 text-sm font-semibold text-zinc-400">Tu patrimonio, claro.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-5 backdrop-blur-xl">
          <Segmented
            options={["Entrar", "Crear cuenta"]}
            value={mode}
            onChange={(i) => {
              setMode(i);
              setError(null);
              setInfo(null);
            }}
          />

          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <Field label="Correo">
              <input
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className={inputCls}
              />
            </Field>
            <Field label="Contraseña" hint={register ? "Mínimo 8 caracteres." : undefined}>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  name="password"
                  autoComplete={register ? "new-password" : "current-password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputCls} pr-12`}
                />
                <button
                  type="button"
                  aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            {error && (
              <p className="text-sm font-bold" style={{ color: NEON.pink }}>
                {error}
              </p>
            )}
            {info && (
              <p className="text-sm font-bold" style={{ color: NEON.cyan }}>
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={!valid || busy}
              className="h-14 w-full rounded-2xl text-lg font-black text-black transition-opacity disabled:opacity-30"
              style={{ background: NEON.lime, boxShadow: valid ? `0 0 24px ${NEON.lime}44` : "none" }}
            >
              {busy ? "Un momento…" : register ? "Crear cuenta" : "Entrar"}
            </button>

            {!register && (
              <button type="button" onClick={() => void forgot()} className="block w-full text-center text-sm font-semibold text-zinc-400">
                ¿Has olvidado la contraseña?
              </button>
            )}
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">Cada cuenta ve únicamente sus propios datos.</p>
      </div>
    </div>
  );
}
