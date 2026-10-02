/*
 * Desbloqueo con Face ID / huella / Windows Hello mediante WebAuthn (autenticador de la plataforma).
 *
 * IMPORTANTE: esto es un BLOQUEO LOCAL de la app, no un inicio de sesión. Firebase Auth ya mantiene tu sesión;
 * aquí solo exigimos verificar tu cara o huella en este dispositivo antes de enseñar tus datos. No lo verifica ningún
 * servidor, así que no sustituye a la contraseña. Un inicio de sesión real con passkeys necesitaría un backend
 * (p. ej. Cloud Functions) que valide la firma y emita un token de Firebase.
 *
 * Requisitos del navegador: contexto seguro (https:// o localhost) y un sensor o PIN configurado en el dispositivo.
 */

const KEY = (uid: string) => `crest.biometric.${uid}`;

const toB64 = (buf: ArrayBuffer): string => {
  let s = "";
  new Uint8Array(buf).forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromB64 = (str: string) => {
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

export function biometricEnabled(uid: string): boolean {
  try {
    return !!localStorage.getItem(KEY(uid));
  } catch {
    return false;
  }
}

export function disableBiometric(uid: string): void {
  try {
    localStorage.removeItem(KEY(uid));
  } catch {
    /* sin almacenamiento */
  }
}

export async function biometricSupported(): Promise<boolean> {
  if (typeof window === "undefined" || !window.isSecureContext || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Registra una credencial en este dispositivo (pide Face ID / huella). false si se cancela o falla. */
export async function enableBiometric(uid: string, label: string): Promise<boolean> {
  try {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: "Crest" }, // el dominio (rp.id) se toma de la dirección actual
        user: { id: new TextEncoder().encode(uid.slice(0, 64)), name: label, displayName: label },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "discouraged" },
        attestation: "none",
        timeout: 60000,
      },
    });
    if (!cred) return false;
    localStorage.setItem(KEY(uid), toB64((cred as PublicKeyCredential).rawId));
    return true;
  } catch {
    return false; // cancelado o sin soporte
  }
}

/** Pide verificar la cara / huella. true si el usuario se ha identificado. */
export async function verifyBiometric(uid: string): Promise<boolean> {
  try {
    const id = localStorage.getItem(KEY(uid));
    if (!id) return false;
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: "public-key", id: fromB64(id), transports: ["internal"] }],
        userVerification: "required",
        timeout: 60000,
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
}
