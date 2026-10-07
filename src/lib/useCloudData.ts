import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, limit as limitTo, onSnapshot, orderBy, query, setDoc, updateDoc } from "firebase/firestore";
import type { DocumentData, Query } from "firebase/firestore";
import { db } from "./firebase";
import { describeFirestoreError, goalDoc, goalPatch, holdingDoc, holdingPatch, nextPast, ruleDoc, rulePatch, snapshotDoc, toGoal, toHolding, toRule, toTx, txDoc } from "./db";
import { monthKey, toDayKey } from "./transactions";
import type { GoalView, HistoryPoint, Holding, NewGoalInput, NewHoldingInput, NewRule, RecurringRule, Tx } from "./models";

const dayLabel = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
};

/** Datos del usuario en tiempo real desde Firestore + las operaciones para modificarlos. */
export function useCloudData(uid: string) {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [goals, setGoals] = useState<GoalView[]>([]);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mark = (k: string) => setLoaded((l) => (l[k] ? l : { ...l, [k]: true }));
    const fail = (e: unknown) => {
      console.error(e);
      setError(describeFirestoreError(e));
    };
    const listen = <T,>(name: string, q: Query<DocumentData>, map: (id: string, d: DocumentData) => T, set: (v: T[]) => void) =>
      onSnapshot(
        q,
        (snap) => {
          set(snap.docs.map((d) => map(d.id, d.data())));
          mark(name);
        },
        fail,
      );
    const user = (name: string) => collection(db, "users", uid, name);

    const unsubs = [
      listen("txs", user("transactions"), toTx, setTxs),
      listen("rules", user("rules"), toRule, setRules),
      listen("holdings", user("holdings"), toHolding, (v) => setHoldings([...v].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)))),
      listen("goals", user("goals"), toGoal, (v) => setGoals([...v].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)))),
      listen(
        "history",
        query(user("snapshots"), orderBy("day", "desc"), limitTo(365)),
        (_id, d): HistoryPoint => ({ day: String(d.day), date: dayLabel(String(d.day)), v: Number(d.v) }),
        (v) => setHistory([...v].reverse()),
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [uid]);

  // Operaciones estables (no cambian entre renders). Escribir es instantáneo en pantalla; si el servidor las rechaza, avisa.
  const actions = useMemo(() => {
    const run = (p: Promise<unknown>) => {
      p.catch((e) => {
        console.error(e);
        setError(describeFirestoreError(e));
      });
    };
    const user = (name: string) => collection(db, "users", uid, name);
    return {
      addTx: (t: Omit<Tx, "id" | "recurring">) => run(setDoc(doc(user("transactions")), txDoc(t))),
      addRule: (r: NewRule) => run(setDoc(doc(user("rules")), ruleDoc(r, monthKey(new Date())))),
      // Misma id: se actualiza el documento existente. Si cambia el importe/frecuencia, vale desde hoy (o a todo el historial si retro).
      updateRule: (old: RecurringRule, next: NewRule, retro: boolean) =>
        run(updateDoc(doc(db, "users", uid, "rules", old.id), rulePatch(next, nextPast(old, next, retro)))),
      // Deja de aplicarse desde hoy; el historial ya aplicado se conserva
      endRule: (id: string) => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        run(updateDoc(doc(db, "users", uid, "rules", id), { end: toDayKey(yesterday) }));
      },
      deleteRule: (id: string) => run(deleteDoc(doc(db, "users", uid, "rules", id))),
      updateTx: (id: string, t: Omit<Tx, "id" | "recurring">) => run(updateDoc(doc(db, "users", uid, "transactions", id), txDoc(t))),
      deleteTx: (id: string) => run(deleteDoc(doc(db, "users", uid, "transactions", id))),
      updateHolding: (id: string, h: NewHoldingInput) => run(updateDoc(doc(db, "users", uid, "holdings", id), holdingPatch(h))),
      deleteHolding: (id: string) => run(deleteDoc(doc(db, "users", uid, "holdings", id))),
      saveMainStart: (v: number) => run(updateDoc(doc(db, "users", uid), { mainStart: v })),
      addHolding: (h: NewHoldingInput) => run(setDoc(doc(user("holdings")), holdingDoc(h))),
      addGoal: (g: NewGoalInput) => run(setDoc(doc(user("goals")), goalDoc(g))),
      updateGoal: (id: string, g: NewGoalInput) => run(updateDoc(doc(db, "users", uid, "goals", id), goalPatch(g))),
      deleteGoal: (id: string) => run(deleteDoc(doc(db, "users", uid, "goals", id))),
      saveSnapshot: (day: string, v: number) => run(setDoc(doc(db, "users", uid, "snapshots", day), snapshotDoc(day, v))),
      saveLimit: (v: number) => run(updateDoc(doc(db, "users", uid), { limit: v })),
      clearError: () => setError(null),
    };
  }, [uid]);

  const ready = ["txs", "rules", "holdings", "goals", "history"].every((k) => loaded[k]);
  return { txs, rules, holdings, goals, history, ready, error, ...actions };
}
