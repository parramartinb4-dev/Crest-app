import { formatEUR } from "../lib/format";
import { NEON } from "../lib/theme";
import { TODAY } from "../lib/dates";
import { CATS } from "../lib/categories";
import { monthKey, dateLabel } from "../lib/transactions";
import { Card, Heading, CatIcon } from "../components/ui";
import type { Tx, RecurringRule } from "../lib/models";

/** Estado de un gasto fijo este mes respecto a hoy y a la fecha del saldo inicial. */
function ruleState(r: RecurringRule, since: Date): string {
  const occurrence = new Date(TODAY.getFullYear(), TODAY.getMonth(), r.day).getTime();
  if (occurrence > TODAY.getTime()) return "próximo";
  if (occurrence < since.getTime()) return "desde el mes que viene";
  return r.type === "income" ? "ingresado este mes" : "aplicado este mes";
}

export function Accounts({ txs, rules, mainBal, since }: { txs: Tx[]; rules: RecurringRule[]; mainBal: number; since: Date }) {
  const shown = txs.filter((t) => t.date.getTime() >= since.getTime()); // lo anterior ya estaba en tu saldo inicial
  const spent = txs
    .filter((t) => t.type === "expense" && monthKey(t.date) === monthKey(TODAY))
    .reduce((s, t) => s + t.amount, 0);
  return (
    <section>
      <h1 className="text-4xl font-black tracking-tight">Cuentas</h1>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Saldo principal</p>
      <p className="mt-1 text-5xl font-black tabular-nums tracking-tighter" style={{ color: NEON.cyan }}>
        {formatEUR(mainBal)}
      </p>
      <p className="mt-2 text-xs text-zinc-500">
        Cuenta y tarjeta comparten el mismo saldo · Gastado este mes: <span className="font-bold text-zinc-300">{formatEUR(spent)}</span>
      </p>

      <Heading>Fijos mensuales</Heading>
      <div className="space-y-2">
        {rules.length === 0 && (
          <Card className="text-center text-sm text-zinc-500" pad="p-4">
            Sin movimientos fijos. Añade uno con + activando «Gasto fijo mensual» o «Ingreso fijo mensual».
          </Card>
        )}
        {[...rules]
          .sort((x, y) => x.day - y.day)
          .map((r) => {
            const income = r.type === "income";
            return (
              <Card key={r.id} className="flex items-center gap-3" pad="p-3">
                <CatIcon cat={CATS[r.cat]} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{r.name}</p>
                  <p className="text-xs text-zinc-500">
                    Día {r.day} de cada mes · {ruleState(r, since)}
                  </p>
                </div>
                <span className="text-sm font-extrabold tabular-nums" style={{ color: income ? NEON.lime : "#fff" }}>
                  {income ? "+" : "-"}
                  {formatEUR(r.amount)}
                </span>
              </Card>
            );
          })}
      </div>

      <Heading>Historial</Heading>
      <div className="space-y-2">
        {shown.length === 0 && (
          <Card className="text-center text-sm text-zinc-500" pad="p-4">
            Todavía no hay movimientos. Pulsa + para registrar el primero.
          </Card>
        )}
        {shown.map((t) => {
          const cat = CATS[t.cat];
          return (
            <Card key={t.id} className="flex items-center gap-3" pad="p-3">
              <CatIcon cat={cat} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{t.name}</p>
                <p className="text-xs text-zinc-500">
                  {dateLabel(t.date)} · {t.method === "card" ? "Tarjeta" : "Cuenta"}
                  {t.recurring ? " · Fijo" : ""}
                </p>
              </div>
              <span className="text-sm font-extrabold tabular-nums" style={{ color: t.type === "income" ? NEON.lime : "#fff" }}>
                {t.type === "income" ? "+" : "-"}
                {formatEUR(t.amount)}
              </span>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
