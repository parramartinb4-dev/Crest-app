import { Pencil } from "lucide-react";
import { formatEUR } from "../lib/format";
import { NEON } from "../lib/theme";
import { TODAY } from "../lib/dates";
import { CATS } from "../lib/categories";
import { monthKey, dateLabel } from "../lib/transactions";
import { isActiveRule, monthlyEquivalent, nextOccurrence, scheduleText } from "../lib/recurrence";
import { Card, Heading, CatIcon } from "../components/ui";
import type { EditingEntry, RecurringRule, Tx } from "../lib/models";

const fmtDate = (d: Date) => d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

export function Accounts({
  txs,
  rules,
  mainBal,
  since,
  onEdit,
  onAdjustBalance,
}: {
  txs: Tx[];
  rules: RecurringRule[];
  mainBal: number;
  since: Date;
  onEdit: (e: EditingEntry) => void;
  onAdjustBalance: () => void;
}) {
  const shown = txs.filter((t) => t.date.getTime() >= since.getTime()); // lo anterior ya estaba en tu saldo inicial
  const spent = txs.filter((t) => t.type === "expense" && monthKey(t.date) === monthKey(TODAY)).reduce((s, t) => s + t.amount, 0);

  // Activos primero, por próxima fecha; los que dejaste de aplicar, al final
  const sortedRules = rules
    .map((r) => ({ r, next: nextOccurrence(r) }))
    .sort((a, b) => (a.next?.getTime() ?? Infinity) - (b.next?.getTime() ?? Infinity));

  const openFromTx = (t: Tx) => {
    const rule = t.recurring ? rules.find((r) => r.id === t.ruleId) : undefined;
    onEdit(rule ? { kind: "rule", rule } : { kind: "tx", tx: t });
  };

  return (
    <section>
      <h1 className="text-4xl font-black tracking-tight">Cuentas</h1>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Saldo principal</p>
        <button onClick={onAdjustBalance} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
          <Pencil size={12} />
          Ajustar
        </button>
      </div>
      <p className="mt-1 text-5xl font-black tabular-nums tracking-tighter" style={{ color: NEON.cyan }}>
        {formatEUR(mainBal)}
      </p>
      <p className="mt-2 text-xs text-zinc-500">
        Cuenta y tarjeta comparten el mismo saldo · Gastado este mes: <span className="font-bold text-zinc-300">{formatEUR(spent)}</span>
      </p>

      <Heading>Fijos recurrentes</Heading>
      <div className="space-y-2">
        {rules.length === 0 && (
          <Card className="text-center text-sm text-zinc-500" pad="p-4">
            Sin movimientos fijos. Añade uno con + activando «Gasto fijo» o «Ingreso fijo» (semanal, mensual, trimestral o anual).
          </Card>
        )}
        {sortedRules.map(({ r, next }) => {
          const income = r.type === "income";
          const active = isActiveRule(r);
          return (
            <button
              type="button"
              key={r.id}
              onClick={() => onEdit({ kind: "rule", rule: r })}
              aria-label={`Editar ${r.name}`}
              className="block w-full text-left transition-transform active:scale-[0.98]"
            >
              <Card className="flex items-center gap-3" pad="p-3">
                <div style={{ opacity: active ? 1 : 0.4 }}>
                  <CatIcon cat={CATS[r.cat]} size={40} />
                </div>
                <div className="min-w-0 flex-1" style={{ opacity: active ? 1 : 0.5 }}>
                  <p className="truncate text-sm font-bold">{r.name}</p>
                  <p className="text-xs text-zinc-500">{scheduleText(r)}</p>
                  <p className="text-xs text-zinc-500">
                    {next ? `Próximo: ${fmtDate(next)}` : "Dejó de aplicarse"}
                    {r.freq !== "monthly" && ` · = ${formatEUR(monthlyEquivalent(r.amount, r.freq))}/mes`}
                  </p>
                </div>
                <span className="text-sm font-extrabold tabular-nums" style={{ color: income ? NEON.lime : "#fff", opacity: active ? 1 : 0.5 }}>
                  {income ? "+" : "-"}
                  {formatEUR(r.amount)}
                </span>
                <Pencil size={14} className="shrink-0 text-zinc-600" />
              </Card>
            </button>
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
            <button
              type="button"
              key={t.id}
              onClick={() => openFromTx(t)}
              aria-label={`Editar ${t.name}`}
              className="block w-full text-left transition-transform active:scale-[0.98]"
            >
              <Card className="flex items-center gap-3" pad="p-3">
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
            </button>
          );
        })}
      </div>
    </section>
  );
}
