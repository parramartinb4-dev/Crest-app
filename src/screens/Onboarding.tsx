import { useEffect, useState } from "react";
import { ChevronLeft, Fingerprint } from "lucide-react";
import type { User } from "firebase/auth";
import { completeOnboarding, describeFirestoreError } from "../lib/db";
import { biometricSupported, enableBiometric } from "../lib/biometric";
import { formatEUR, parseEURToCents } from "../lib/format";
import { FONT, GOAL_COLORS, NEON } from "../lib/theme";
import { Field, MoneyInput, inputCls } from "../components/forms";
import { DurationField } from "../components/DurationField";
import { termToDeadline } from "../lib/goals";
import { Logo, GLOW_BG } from "../components/Brand";

const LIMITS = [800, 1200, 1500, 2000];

const bigInput = "w-full bg-transparent text-5xl font-black tabular-nums tracking-tighter outline-none placeholder:text-zinc-700";

export function Onboarding({ user }: { user: User }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [limit, setLimit] = useState("1200");
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalAmount, setGoalAmount] = useState("12");
  const [goalUnit, setGoalUnit] = useState(2); // 0 días, 1 semanas, 2 meses, 3 años
  const [bioOk, setBioOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void biometricSupported().then(setBioOk);
  }, []);

  const total = bioOk ? 5 : 4;
  const balanceC = parseEURToCents(balance);
  const limitC = parseEURToCents(limit);
  const goalC = goalTarget.trim() === "" ? null : parseEURToCents(goalTarget);
  const wantsGoal = goalName.trim() !== "" || goalTarget.trim() !== "";
  const goalDeadline = termToDeadline(goalAmount, goalUnit);
  const goalValid = !wantsGoal || (goalC !== null && goalC > 0 && goalDeadline !== null);

  const canNext = [name.trim().length > 0, balanceC !== null, limitC !== null && limitC > 0, goalValid, true][step];

  const finish = async (withBio: boolean) => {
    if (balanceC === null || limitC === null || limitC <= 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (withBio) await enableBiometric(user.uid, name.trim() || user.email || "Crest"); // si lo cancelas, sigues sin bloqueo
      await completeOnboarding(user.uid, {
        name: name.trim(),
        email: user.email ?? "",
        mainStart: balanceC,
        limit: limitC,
        goal:
          wantsGoal && goalC !== null && goalC > 0 && goalDeadline !== null
            ? { name: goalName.trim() || "Mi primera meta", target: goalC, saved: 0, deadline: goalDeadline!.toISOString(), color: GOAL_COLORS[0] }
            : undefined,
      });
    } catch (e) {
      setError(describeFirestoreError(e));
      setBusy(false);
    }
  };

  const next = () => {
    if (!canNext) return;
    if (step === 3 && !bioOk) {
      void finish(false); // sin biometría disponible, la meta es el último paso
      return;
    }
    if (step < total - 1) setStep(step + 1);
  };

  const lastDataStep = step === 3;
  const nextLabel = lastDataStep ? (bioOk ? "Continuar" : "Empezar") : "Continuar";

  return (
    <div className="flex flex-col px-6 pb-8 pt-6 text-white" style={{ fontFamily: FONT, minHeight: "100dvh", background: `${GLOW_BG}, #000` }}>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        {/* Progreso */}
        <div className="flex h-10 items-center justify-between">
          <button
            aria-label="Atrás"
            onClick={() => setStep(Math.max(0, step - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-opacity"
            style={{ opacity: step > 0 && !busy ? 1 : 0, pointerEvents: step > 0 && !busy ? "auto" : "none" }}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-2">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className="h-2 rounded-full transition-all duration-300"
                style={{ width: i === step ? 24 : 8, background: i <= step ? NEON.lime : "rgba(255,255,255,0.15)" }}
              />
            ))}
          </div>
          <span className="w-10" />
        </div>

        <div key={step} className="fade-in mt-8 flex flex-1 flex-col">
          {step === 0 && (
            <>
              <Logo size={56} />
              <h1 className="mt-5 text-4xl font-black tracking-tight">Bienvenido a Crest</h1>
              <p className="mt-2 text-base text-zinc-400">Lo dejamos listo en menos de un minuto. ¿Cómo te llamas?</p>
              <div className="mt-8">
                <Field label="Nombre">
                  <input
                    value={name}
                    maxLength={60}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && next()}
                    placeholder="Tu nombre"
                    autoComplete="given-name"
                    className={inputCls}
                  />
                </Field>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-4xl font-black tracking-tight">¿Cuánto tienes hoy?</h1>
              <p className="mt-2 text-base text-zinc-400">
                El saldo de tu cuenta principal ahora mismo. Cuenta y tarjeta comparten el mismo saldo: pon lo que ves en tu banco.
              </p>
              <div className="mt-10 flex items-baseline gap-2 border-b border-white/15 pb-3">
                <input
                  inputMode="decimal"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && next()}
                  placeholder="0,00"
                  className={bigInput}
                />
                <span className="text-3xl font-black text-zinc-500">€</span>
              </div>
              {balanceC !== null && (
                <p className="mt-3 text-sm font-semibold tabular-nums" style={{ color: NEON.cyan }}>
                  {formatEUR(balanceC)}
                </p>
              )}
              <p className="mt-6 text-xs text-zinc-500">A partir de aquí, Crest suma y resta los movimientos que registres.</p>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-4xl font-black tracking-tight">¿Cuánto quieres gastar al mes?</h1>
              <p className="mt-2 text-base text-zinc-400">Tu límite mensual. Con él calculamos cuánto puedes gastar cada día y si vas a buen ritmo.</p>
              <div className="mt-10 flex items-baseline gap-2 border-b border-white/15 pb-3">
                <input
                  inputMode="decimal"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && next()}
                  placeholder="1.200"
                  className={bigInput}
                />
                <span className="text-3xl font-black text-zinc-500">€</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {LIMITS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setLimit(String(v))}
                    className="rounded-full border px-4 py-1.5 text-sm font-bold"
                    style={{
                      borderColor: limitC === v * 100 ? NEON.lime : "rgba(255,255,255,0.15)",
                      color: limitC === v * 100 ? NEON.lime : "#a1a1aa",
                    }}
                  >
                    {v.toLocaleString("es-ES")} €
                  </button>
                ))}
              </div>
              <p className="mt-6 text-xs text-zinc-500">Podrás cambiarlo cuando quieras en la pestaña Gasto.</p>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-4xl font-black tracking-tight">¿Tienes una primera meta?</h1>
              <p className="mt-2 text-base text-zinc-400">Es opcional. Cada meta será un anillo que se va llenando. Tus inversiones las añades luego desde su pestaña.</p>
              <div className="mt-6 space-y-4">
                <Field label="Nombre">
                  <input value={goalName} maxLength={120} onChange={(e) => setGoalName(e.target.value)} placeholder="Ej. Comprar tabla funboard" className={inputCls} />
                </Field>
                <Field label="Objetivo">
                  <MoneyInput value={goalTarget} onChange={setGoalTarget} placeholder="Ej. 1.200,00" />
                </Field>
                <DurationField amount={goalAmount} unit={goalUnit} deadline={goalDeadline} onChange={(v) => { setGoalAmount(v.amount); setGoalUnit(v.unit); }} />
                {wantsGoal && !goalValid && (
                  <p className="text-xs font-bold" style={{ color: NEON.pink }}>
                    Indica un objetivo mayor que cero y un plazo válido, o deja nombre y objetivo vacíos para saltar.
                  </p>
                )}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black" style={{ border: `2px solid ${NEON.cyan}66`, boxShadow: `0 0 18px ${NEON.cyan}55` }}>
                <Fingerprint size={30} color={NEON.cyan} />
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-tight">Protege tu dinero</h1>
              <p className="mt-2 text-base text-zinc-400">
                Pide Face ID, huella o el PIN de tu dispositivo cada vez que abras Crest. Es un bloqueo solo en este dispositivo: puedes cambiarlo luego en tu cuenta.
              </p>
            </>
          )}

          {error && (
            <p className="mt-4 text-sm font-bold" style={{ color: NEON.pink }}>
              {error}
            </p>
          )}

          {/* Acciones */}
          <div className="mt-auto space-y-3 pt-8">
            {step < 4 ? (
              <button
                onClick={next}
                disabled={!canNext || busy}
                className="h-14 w-full rounded-2xl text-lg font-black text-black transition-opacity disabled:opacity-30"
                style={{ background: NEON.lime }}
              >
                {busy ? "Guardando…" : step === 3 && !wantsGoal ? (bioOk ? "Saltar por ahora" : "Saltar y empezar") : nextLabel}
              </button>
            ) : (
              <>
                <button
                  onClick={() => void finish(true)}
                  disabled={busy}
                  className="h-14 w-full rounded-2xl text-lg font-black text-black transition-opacity disabled:opacity-30"
                  style={{ background: NEON.lime }}
                >
                  {busy ? "Guardando…" : "Activar Face ID / huella"}
                </button>
                <button onClick={() => void finish(false)} disabled={busy} className="block w-full py-2 text-center text-sm font-semibold text-zinc-400 disabled:opacity-30">
                  Ahora no
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
