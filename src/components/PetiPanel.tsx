"use client";

import { useEffect, useRef, useState } from "react";

export type PetiMsg = { role: "user" | "ai"; text: string; scope?: string; error?: boolean };

const SUGGESTIONS_SLIDE = ["Make this slide more persuasive", "Turn this into a chart", "Simplify for a 10-year-old", "Add a surprising statistic"];
const SUGGESTIONS_DECK = ["Make the whole deck more concise", "Add a slide about pricing before the closing", "Translate the deck to Spanish", "Rewrite in a bolder, more energetic tone"];

type Props = {
  messages: PetiMsg[];
  busy: boolean;
  currentSlide: number;
  onSend: (text: string, scope: "slide" | "deck") => void;
};

export function PetiPanel({ messages, busy, currentSlide, onSend }: Props) {
  const [text, setText] = useState("");
  const [scope, setScope] = useState<"slide" | "deck">("slide");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, busy]);

  const send = (t = text) => {
    if (!t.trim() || busy) return;
    onSend(t.trim(), scope);
    setText("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="rounded-2xl border-[1.5px] border-dashed border-line p-4">
            <p className="font-display font-semibold tracking-tight text-2xl leading-tight">
              What should <span className="text-brand">Peti</span> change?
            </p>
            <p className="mt-1 text-xs text-mute">Ask for a change to this slide or the whole deck — Peti reshapes layouts, tone, data and flow.</p>
            <div className="mt-3 flex flex-col gap-1.5">
              {(scope === "slide" ? SUGGESTIONS_SLIDE : SUGGESTIONS_DECK).map((s) => (
                <button key={s} onClick={() => send(s)} disabled={busy} className="rounded-xl bg-paper-2 px-3 py-2 text-left text-xs font-medium transition hover:bg-ember-soft">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${
                m.role === "user" ? "rounded-br-sm bg-ink text-paper" : m.error ? "rounded-bl-sm bg-red-50 text-red-700" : "rounded-bl-sm border-[1.5px] border-line bg-card"
              }`}
            >
              {m.scope && <span className="mb-0.5 block font-mono text-[10px] uppercase tracking-wide opacity-60">{m.scope}</span>}
              {m.text}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-mute">
            <span className="h-2 w-2 animate-ping rounded-full bg-ember" /> Peti is on it…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t-[1.5px] border-ink p-3">
        <div className="mb-2 grid grid-cols-2 gap-1 rounded-full bg-paper-2 p-0.5 text-xs">
          {(["slide", "deck"] as const).map((s) => (
            <button key={s} onClick={() => setScope(s)} className={`rounded-full py-1 font-medium ${scope === s ? "bg-ink text-paper" : "text-ink-2"}`}>
              {s === "slide" ? `Slide ${currentSlide + 1}` : "Whole deck"}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2 rounded-2xl border-[1.5px] border-ink bg-card p-1.5 pl-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder={scope === "slide" ? "e.g. add a comparison with competitors" : "e.g. add an agenda slide after the title"}
            className="min-w-0 flex-1 resize-none bg-transparent py-1 text-sm outline-none"
          />
          <button onClick={() => send()} disabled={busy || !text.trim()} className="ink-btn primary sm shadow-none!">
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
