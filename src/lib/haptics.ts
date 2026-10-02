/** Vibración corta (Android/Chrome). iOS Safari no soporta navigator.vibrate. */
export const haptic = (): void => {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([30]);
  } catch {
    /* sin soporte */
  }
};
