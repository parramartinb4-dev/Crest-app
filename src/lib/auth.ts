import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase";

// Tras escribir la contraseña no tiene sentido pedir Face ID en el acto: marcamos el acceso como "reciente".
let freshUntil = 0;
export const isFreshLogin = (): boolean => Date.now() < freshUntil;
export const clearFreshLogin = (): void => {
  freshUntil = 0;
};
const markFresh = () => {
  freshUntil = Date.now() + 10 * 60 * 1000;
};

export async function signIn(email: string, password: string): Promise<void> {
  markFresh();
  try {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  } catch (e) {
    clearFreshLogin();
    throw e;
  }
}

export async function signUp(email: string, password: string): Promise<void> {
  markFresh();
  try {
    await createUserWithEmailAndPassword(auth, email.trim(), password);
  } catch (e) {
    clearFreshLogin();
    throw e;
  }
}

export const resetPassword = (email: string): Promise<void> => sendPasswordResetEmail(auth, email.trim());

export const logOut = (): Promise<void> => signOut(auth);

/** Mensaje en castellano para los errores de inicio de sesión. */
export function authMessage(e: unknown): string {
  const code = (e as { code?: string } | null)?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Correo o contraseña incorrectos.";
    case "auth/email-already-in-use":
      return "Ya existe una cuenta con ese correo. Prueba a entrar.";
    case "auth/weak-password":
      return "La contraseña es demasiado débil. Usa al menos 8 caracteres.";
    case "auth/invalid-email":
      return "Ese correo no parece válido.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
    case "auth/network-request-failed":
      return "Sin conexión. Comprueba tu internet e inténtalo de nuevo.";
    case "auth/user-disabled":
      return "Esta cuenta está desactivada.";
    case "auth/operation-not-allowed":
      return "El acceso con correo y contraseña no está activado en Firebase (Authentication → Método de acceso).";
    default:
      return "No se pudo completar la operación. Inténtalo de nuevo.";
  }
}
