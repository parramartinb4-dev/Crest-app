import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { useSession } from "./lib/session";
import { clearFreshLogin, isFreshLogin, logOut } from "./lib/auth";
import { biometricEnabled } from "./lib/biometric";
import { AppShell } from "./AppShell";
import { Login } from "./screens/Login";
import { Onboarding } from "./screens/Onboarding";
import { LockScreen } from "./components/LockScreen";
import { ErrorScreen, Splash } from "./components/Splash";
import type { Profile } from "./lib/models";

const signOutNow = () => {
  void logOut();
};

/** Usuario con sesión y onboarding completado: la app, tapada por el bloqueo si lo tiene activado. */
function Ready({ user, profile }: { user: User; profile: Profile }) {
  const uid = user.uid;
  // Si acabas de escribir la contraseña no se pide Face ID; al restaurar una sesión guardada, sí.
  const [locked, setLocked] = useState(() => biometricEnabled(uid) && !isFreshLogin());

  useEffect(() => {
    clearFreshLogin();
  }, []);

  // Al volver a la app tras un rato fuera, vuelve a bloquearse
  useEffect(() => {
    let hiddenAt = 0;
    const onVisibility = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > 30000 && biometricEnabled(uid)) setLocked(true);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [uid]);

  return (
    <>
      <AppShell uid={uid} email={user.email ?? ""} profile={profile} onSignOut={signOutNow} />
      {locked && <LockScreen uid={uid} onUnlock={() => setLocked(false)} onSignOut={signOutNow} />}
    </>
  );
}

export default function App() {
  const s = useSession();
  switch (s.status) {
    case "loading":
      return <Splash slow={s.slow} />;
    case "error":
      return <ErrorScreen message={s.message} onSignOut={signOutNow} />;
    case "signedOut":
      return <Login />;
    case "needsOnboarding":
      return <Onboarding key={s.user.uid} user={s.user} />;
    case "ready":
      return <Ready key={s.user.uid} user={s.user} profile={s.profile} />;
  }
}
