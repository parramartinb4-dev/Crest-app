import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// La configuración vive en .env.local (VITE_FIREBASE_*). Son claves públicas: identifican el proyecto,
// no lo protegen. La protección real son las reglas de Firestore (firestore.rules).
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missing = Object.entries(config)
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (missing.length) {
  throw new Error(`Faltan claves de Firebase en .env.local (${missing.join(", ")}). Copia .env.example como .env.local y rellénalo.`);
}

const app = getApps().length ? getApp() : initializeApp(config);

export const auth = getAuth(app);

// Caché local persistente: la app abre al instante y funciona sin conexión; se sincroniza al volver.
function createDb() {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
      ignoreUndefinedProperties: true,
    });
  } catch {
    return getFirestore(app); // ya inicializado (recarga en caliente de Vite)
  }
}
export const db = createDb();
