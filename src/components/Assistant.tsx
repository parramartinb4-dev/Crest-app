import { useState, useEffect, useRef } from "react";
import { Sparkles, Send, X } from "lucide-react";
import { NEON } from "../lib/theme";
import type { ChatMessage } from "../lib/models";

export const CONIC = `conic-gradient(from 0deg, ${NEON.lime}, ${NEON.cyan}, ${NEON.pink}, ${NEON.lime})`;

export function AssistantButton({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <button
      aria-label="Abrir asistente financiero"
      onClick={onClick}
      className="absolute bottom-44 right-5 z-30 h-14 w-14 rounded-full transition-all duration-300"
      style={{ opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.6)", pointerEvents: visible ? "auto" : "none" }}
    >
      <span className="absolute -inset-1 animate-spin rounded-full opacity-70 blur-md" style={{ background: CONIC, animationDuration: "5s" }} />
      <span className="absolute inset-0 animate-spin rounded-full" style={{ background: CONIC, animationDuration: "5s" }} />
      <span className="absolute flex items-center justify-center rounded-full bg-black" style={{ inset: 2 }}>
        <Sparkles size={24} color={NEON.cyan} />
      </span>
    </button>
  );
}

export function ChatPanel({ open, onClose, messages, typing, onSend }: { open: boolean; onClose: () => void; messages: ChatMessage[]; typing: boolean; onSend: (text: string) => void }) {
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  const submit = (text: string) => {
    if (!text.trim()) return;
    onSend(text);
    setInput("");
  };

  return (
    <>
      {/* Fondo difuminado */}
      <div
        onClick={onClose}
        className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
      />
      {/* Hoja que sube desde abajo */}
      <div
        className="absolute inset-x-0 bottom-0 z-50 mx-auto flex max-w-md flex-col rounded-t-3xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl"
        style={{
          height: "72%",
          transform: open ? "translateY(0)" : "translateY(105%)",
          transition: "transform 420ms cubic-bezier(.22,1,.36,1)",
        }}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-white/20" />
        <div className="flex items-center justify-between px-5 pb-2 pt-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} color={NEON.cyan} />
            <div>
              <p className="text-base font-extrabold leading-tight">Asistente</p>
              <p className="text-[10px] font-semibold text-zinc-500">Vista previa · respuestas simuladas</p>
            </div>
          </div>
          <button aria-label="Cerrar" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
            <X size={16} />
          </button>
        </div>

        <div ref={listRef} className="no-sb flex-1 space-y-2 overflow-y-auto overscroll-contain px-4 py-2">
          {messages.map((m) =>
            m.role === "user" ? (
              <div
                key={m.id}
                className="ml-auto w-fit max-w-[80%] rounded-3xl rounded-br-lg px-4 py-2.5 text-sm font-semibold text-black"
                style={{ background: NEON.cyan }}
              >
                {m.text}
              </div>
            ) : (
              <div
                key={m.id}
                className="mr-auto w-fit max-w-[80%] rounded-3xl rounded-bl-lg border border-white/5 bg-white/10 px-4 py-2.5 text-sm text-zinc-100"
              >
                {m.text}
              </div>
            )
          )}
          {typing && (
            <div className="mr-auto flex w-fit gap-1 rounded-3xl rounded-bl-lg bg-white/10 px-4 py-3.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          )}
          {messages.length === 1 && !typing && (
            <div className="flex flex-wrap gap-2 pt-2">
              {["¿Cómo va mi cartera?", "¿Voy bien con mis metas?"].map((q) => (
                <button
                  key={q}
                  onClick={() => submit(q)}
                  className="rounded-full border px-3 py-1.5 text-xs font-bold"
                  style={{ borderColor: NEON.cyan + "80", color: NEON.cyan }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-4 pb-5 pt-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit(input)}
            placeholder="Pregunta sobre tu dinero…"
            className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-white/30"
          />
          <button
            aria-label="Enviar"
            onClick={() => submit(input)}
            disabled={!input.trim() || typing}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-black transition-opacity disabled:opacity-30"
            style={{ background: NEON.lime }}
          >
            <Send size={18} strokeWidth={2.6} />
          </button>
        </div>
      </div>
    </>
  );
}
