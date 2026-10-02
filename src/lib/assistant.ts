import type { ChatMessage } from "./models";

/**
 * FASE 2: único punto a tocar para conectar un LLM real. Sustituye el cuerpo por un fetch
 * a tu propio backend (nunca pongas la API key en el frontend) y devuelve el texto.
 */
export async function askAssistant(text: string, { screen, history }: { screen: string; history: ChatMessage[] }): Promise<string> {
  await new Promise((r) => setTimeout(r, 1300)); // respuesta simulada (MVP)
  return screen === "metas"
    ? "Vas muy bien con tus metas: el fondo de emergencia ya está al 70 %. ¿Quieres que calculemos cuánto aportar cada mes para llegar a tiempo?"
    : "He analizado tus inversiones y noto un buen progreso. ¿Te gustaría que busquemos formas de optimizar tus aportaciones mensuales?";
}
