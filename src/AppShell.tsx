import { useState, useRef, useEffect } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { LayoutDashboard, Wallet, TrendingUp, Target, Gauge, Plus, UserRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NEON, FONT, GOAL_COLORS } from "./lib/theme";
import { totalValue } from "./lib/investments";
import { haptic } from "./lib/haptics";
import { detectCat } from "./lib/categories";
import { sumTx, recurringTxs, toDayKey } from "./lib/transactions";
import { askAssistant } from "./lib/assistant";
import { useCloudData } from "./lib/useCloudData";
import { Fab } from "./components/Fab";
import { QuickAdd } from "./components/QuickAdd";
import { AddInvestment } from "./components/AddInvestment";
import { AddGoal } from "./components/AddGoal";
import { SettingsSheet } from "./components/SettingsSheet";
import { BalanceSheet } from "./components/BalanceSheet";
import { Splash, ErrorScreen } from "./components/Splash";
import { AssistantButton, ChatPanel } from "./components/Assistant";
import { Dashboard } from "./screens/Dashboard";
import { Goals } from "./screens/Goals";
import { Accounts } from "./screens/Accounts";
import { Investments } from "./screens/Investments";
import { SpendControl } from "./screens/SpendControl";
import type { TabId, NewTxInput, ChatMessage, NewHoldingInput, NewGoalInput, Profile, GoalView, Holding, EditingEntry } from "./lib/models";

const NAV: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "patrimonio", label: "Patrimonio", icon: LayoutDashboard },
  { id: "cuentas", label: "Cuentas", icon: Wallet },
  { id: "inversiones", label: "Inversiones", icon: TrendingUp },
  { id: "metas", label: "Metas", icon: Target },
  { id: "gasto", label: "Gasto", icon: Gauge },
];

export function AppShell({ uid, email, profile, onSignOut }: { uid: string; email: string; profile: Profile; onSignOut: () => void }) {
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const target = useRef<number | null>(null); // destino cuando la navegación viene de un toque en el menú
  const raf = useRef(0);
  const drag = useRef<{ x: number; left: number } | null>(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EditingEntry | null>(null); // null = movimiento nuevo
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [invOpen, setInvOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState<Holding | null>(null); // null = inversión nueva
  const [goalOpen, setGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalView | null>(null); // null = crear una nueva
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Datos del usuario en tiempo real desde Firestore
  const cloud = useCloudData(uid);
  const { txs, rules, holdings, goals, history } = cloud;

  // Límite mensual: cambia al instante en pantalla y se guarda en la nube 0,6 s después de soltar
  const [limit, setLimitState] = useState(profile.limit);
  const limitTimer = useRef<number | undefined>(undefined);
  const setLimit = (v: number) => {
    setLimitState(v);
    window.clearTimeout(limitTimer.current);
    limitTimer.current = window.setTimeout(() => cloud.saveLimit(v), 600);
  };

  // Movimientos = los tuyos + los gastos fijos que ya tocaba pagar. El saldo solo cuenta lo posterior al saldo inicial.
  const since = profile.balanceSince;
  const allTxs = [...txs, ...recurringTxs(rules, since)].sort((a, b) => b.date.getTime() - a.date.getTime());
  const counted = allTxs.filter((t) => t.date.getTime() >= since.getTime());
  const mainBal = profile.mainStart + sumTx(counted); // cuenta y tarjeta restan del mismo saldo
  const invest = totalValue(holdings);
  const netWorth = mainBal + invest;

  // Una foto del patrimonio al día alimenta la gráfica de crecimiento (solo se escribe si cambia)
  useEffect(() => {
    if (!cloud.ready) return;
    const day = toDayKey(new Date());
    const last = history[history.length - 1];
    if (last && last.day === day && last.v === netWorth) return;
    const t = window.setTimeout(() => cloud.saveSnapshot(day, netWorth), 1500);
    return () => window.clearTimeout(t);
  }, [cloud.ready, cloud.saveSnapshot, netWorth, history]);

  const openTxForm = (e: EditingEntry | null) => {
    setEditingEntry(e);
    setModalOpen(true);
  };
  const saveTx = ({ type, amount, name, method, fixed, day, freq, month, date, retro }: NewTxInput) => {
    const cat = type === "income" ? "ingreso" : detectCat(name);
    const label = name.trim() || (type === "income" ? "Ingreso" : "Gasto");
    if (editingEntry?.kind === "rule") cloud.updateRule(editingEntry.rule, { type, name: label, amount, freq, day, month, method, cat }, !!retro);
    else if (editingEntry?.kind === "tx") cloud.updateTx(editingEntry.tx.id, { name: label, amount, type, cat, method, date: date ?? editingEntry.tx.date });
    else if (fixed) cloud.addRule({ type, name: label, amount, freq, day, month, method, cat });
    else cloud.addTx({ name: label, amount, type, cat, method, date: new Date() });
    setModalOpen(false);
  };
  const removeEntry = () => {
    if (editingEntry?.kind === "rule") cloud.deleteRule(editingEntry.rule.id);
    else if (editingEntry?.kind === "tx") cloud.deleteTx(editingEntry.tx.id);
    setModalOpen(false);
  };
  const stopRule = () => {
    if (editingEntry?.kind === "rule") cloud.endRule(editingEntry.rule.id);
    setModalOpen(false);
  };
  // Pones el saldo real que ves en el banco; Crest recalcula el saldo inicial para que cuadre
  const adjustBalance = (target: number) => {
    cloud.saveMainStart(target - sumTx(counted));
    setBalanceOpen(false);
  };

  const openHoldingForm = (h: Holding | null) => {
    setEditingHolding(h);
    setInvOpen(true);
  };
  const saveHolding = (h: NewHoldingInput) => {
    if (editingHolding) cloud.updateHolding(editingHolding.id, h);
    else cloud.addHolding(h);
    setInvOpen(false);
  };
  const removeHolding = () => {
    if (editingHolding) cloud.deleteHolding(editingHolding.id);
    setInvOpen(false);
  };
  const openGoalForm = (g: GoalView | null) => {
    setEditingGoal(g);
    setGoalOpen(true);
  };
  const saveGoal = (g: NewGoalInput) => {
    if (editingGoal) cloud.updateGoal(editingGoal.id, g);
    else cloud.addGoal(g);
    setGoalOpen(false);
  };
  const removeGoal = () => {
    if (editingGoal) cloud.deleteGoal(editingGoal.id);
    setGoalOpen(false);
  };
  // El "+" de la cabecera abre el formulario de la sección en la que estás
  const openAdd = () => (active === 2 ? openHoldingForm(null) : active === 3 ? openGoalForm(null) : openTxForm(null));
  const addLabel = active === 2 ? "Añadir inversión" : active === 3 ? "Añadir meta" : "Añadir movimiento";

  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: "assistant", text: "Hola, soy tu asistente financiero. Pregúntame por tus inversiones o tus metas." },
  ]);

  const sendMessage = async (text: string) => {
    if (typing) return;
    const history = messages;
    setMessages((m) => [...m, { id: Date.now(), role: "user", text }]);
    setTyping(true);
    try {
      const reply = await askAssistant(text, { screen: NAV[activeRef.current].id, history });
      setMessages((m) => [...m, { id: Date.now() + 1, role: "assistant", text: reply }]);
    } catch (e) {
      setMessages((m) => [...m, { id: Date.now() + 1, role: "assistant", text: "No he podido responder ahora mismo. Inténtalo de nuevo." }]);
    } finally {
      setTyping(false);
    }
  };

  const handleIndex = (idx: number) => {
    if (target.current !== null) {
      if (idx === target.current) target.current = null; // llegó: se acabó el scroll programático
      return; // sin háptica ni saltos de icono durante el viaje
    }
    if (idx !== activeRef.current) {
      activeRef.current = idx;
      setActive(idx);
      haptic(); // golpe háptico al cambiar de pantalla deslizando
    }
  };

  const onScroll = () => {
    const el = scroller.current;
    if (!el || raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      handleIndex(Math.round(el.scrollLeft / el.clientWidth));
    });
  };

  const goTo = (i: number) => {
    const el = scroller.current;
    if (!el || i === activeRef.current) return;
    target.current = i;
    activeRef.current = i;
    setActive(i);
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setTimeout(() => (target.current = null), 900); // seguro por si no llega evento final
  };

  /* Arrastre con ratón (en táctil lo hace el navegador nativamente) */
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || (e.target as HTMLElement).closest("[data-no-swipe]")) return;
    drag.current = { x: e.clientX, left: scroller.current!.scrollLeft };
    setDragging(true);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    scroller.current!.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
  };
  const endDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: Math.round(el.scrollLeft / el.clientWidth) * el.clientWidth, behavior: "smooth" });
  };

  const screens = [
    <Dashboard cash={mainBal} invest={invest} history={history} />,
    <Accounts txs={allTxs} rules={rules} mainBal={mainBal} since={since} onEdit={openTxForm} onAdjustBalance={() => setBalanceOpen(true)} />,
    <Investments holdings={holdings} onSelect={openHoldingForm} />,
    <Goals active={active === 3} goals={goals} onSelect={openGoalForm} />,
    <SpendControl active={active === 4} txs={allTxs} rules={rules} limit={limit} setLimit={setLimit} />,
  ];

  // Hasta recibir los datos no pintamos pantallas vacías
  if (!cloud.ready) return cloud.error ? <ErrorScreen message={cloud.error} onSignOut={onSignOut} /> : <Splash />;

  return (
    <div className="relative overflow-hidden bg-black text-white" style={{ fontFamily: FONT, height: "100dvh", minHeight: 560 }}>

      {/* Cabecera flotante (cristal) */}
      <header className="absolute inset-x-0 top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md items-center justify-between px-5 py-3">
          <span className="text-base font-extrabold tracking-tight">Crest</span>
          <div className="flex items-center gap-2">
            <button
              aria-label="Tu cuenta"
              onClick={() => setSettingsOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
            >
              <UserRound size={18} />
            </button>
            <button
              aria-label={addLabel}
              onClick={openAdd}
              className="flex h-9 w-9 items-center justify-center rounded-full text-black"
              style={{ background: NEON.lime }}
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>
        </div>
      </header>

      {/* Aviso si una escritura en la nube falla */}
      {cloud.error && (
        <div
          className="absolute inset-x-4 top-16 z-30 mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-white/10 bg-zinc-900/90 p-3 text-xs font-semibold backdrop-blur-lg"
          style={{ color: NEON.pink }}
        >
          <span className="flex-1">{cloud.error}</span>
          <button aria-label="Cerrar aviso" onClick={cloud.clearError}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Carrusel horizontal con imán */}
      <div
        ref={scroller}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className={`no-sb flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden ${dragging ? "select-none" : ""}`}
        style={{ scrollSnapType: dragging ? "none" : undefined, overscrollBehaviorX: "contain" }}
      >
        {screens.map((screen, i) => (
          <div key={NAV[i].id} className="no-sb h-full w-full shrink-0 snap-center snap-always overflow-y-auto overscroll-contain">
            <div className="mx-auto max-w-md px-5 pb-32 pt-20">{screen}</div>
          </div>
        ))}
      </div>

      {/* Barra inferior flotante (cristal), sincronizada */}
      <nav className="absolute inset-x-4 bottom-4 z-20 mx-auto flex max-w-md items-center justify-around rounded-full border border-white/10 bg-black/70 px-2 py-2 backdrop-blur-lg">
        {NAV.map(({ id, label, icon: Icon }, i) => {
          const on = active === i;
          return (
            <button
              key={id}
              onClick={() => goTo(i)}
              className="flex flex-col items-center gap-0.5 rounded-full px-3 py-1.5 text-[10px] font-bold transition-all duration-300"
              style={{ color: on ? NEON.lime : "#71717a", transform: on ? "scale(1.1)" : "scale(1)" }}
            >
              <Icon size={22} strokeWidth={on ? 2.6 : 2} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Botón "+" por sección y asistente (encima del "+") en Inversiones (2) y Metas (3) */}
      <AssistantButton visible={active === 2 || active === 3} onClick={() => setChatOpen(true)} />
      <Fab visible={active === 1} onClick={() => openTxForm(null)} />
      <Fab visible={active === 2} onClick={() => openHoldingForm(null)} label="Añadir inversión" />
      <Fab visible={active === 3} onClick={() => openGoalForm(null)} label="Añadir meta" />
      <QuickAdd open={modalOpen} onClose={() => setModalOpen(false)} onSave={saveTx} editing={editingEntry} onDelete={removeEntry} onStop={stopRule} />
      <BalanceSheet open={balanceOpen} onClose={() => setBalanceOpen(false)} balance={mainBal} onSave={adjustBalance} />
      <AddInvestment open={invOpen} onClose={() => setInvOpen(false)} onSave={saveHolding} holding={editingHolding} onDelete={removeHolding} />
      <AddGoal
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        onSave={saveGoal}
        onDelete={removeGoal}
        goal={editingGoal}
        nextColor={GOAL_COLORS[goals.length % GOAL_COLORS.length]}
      />
      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        uid={uid}
        name={profile.name}
        email={email}
        onSignOut={onSignOut}
      />
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} messages={messages} typing={typing} onSend={sendMessage} />
    </div>
  );
}
