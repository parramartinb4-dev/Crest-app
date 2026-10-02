import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import { describeFirestoreError, toProfile } from "./db";
import type { Profile } from "./models";

export type Session =
  | { status: "loading"; slow: boolean }
  | { status: "error"; message: string }
  | { status: "signedOut" }
  | { status: "needsOnboarding"; user: User }
  | { status: "ready"; user: User; profile: Profile };

const SessionContext = createContext<Session>({ status: "loading", slow: false });
export const useSession = (): Session => useContext(SessionContext);

/** Quién ha entrado y si ya completó el onboarding (perfil en users/{uid}). */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = aún comprobando
  const [pf, setPf] = useState<{ uid: string; profile: Profile | null } | null>(null);
  const [err, setErr] = useState<{ uid: string; message: string } | null>(null);
  const [slow, setSlow] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  const uid = user?.uid;
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      doc(db, "users", uid),
      { includeMetadataChanges: true },
      (snap) => {
        const data = snap.data();
        if (data) setPf({ uid, profile: toProfile(data) });
        else if (!snap.metadata.fromCache) setPf({ uid, profile: null }); // el servidor confirma que no existe: primer acceso
      },
      (e) => {
        console.error(e);
        setErr({ uid, message: describeFirestoreError(e) });
      },
    );
  }, [uid]);

  // pf y err son de un usuario concreto: si cambia la cuenta, los de la anterior se ignoran.
  const profile = user && pf && pf.uid === user.uid ? pf.profile : undefined;
  const error = user && err && err.uid === user.uid ? err.message : null;

  let value: Session;
  if (error) value = { status: "error", message: error };
  else if (user === undefined) value = { status: "loading", slow };
  else if (user === null) value = { status: "signedOut" };
  else if (profile === undefined) value = { status: "loading", slow };
  else if (profile === null || !profile.onboarded) value = { status: "needsOnboarding", user };
  else value = { status: "ready", user, profile };

  const loading = value.status === "loading";
  useEffect(() => {
    if (!loading) {
      setSlow(false);
      return;
    }
    const t = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(t);
  }, [loading]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
