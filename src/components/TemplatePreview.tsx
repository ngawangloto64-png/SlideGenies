"use client";

import { useEffect, useState } from "react";
import { FONT_STACKS, applyBrand, type Brand, type Template } from "@/lib/templates";
import { ART_LABELS } from "@/lib/art";
import { SAMPLE_DECK } from "@/lib/sample";
import type { Deck } from "@/lib/schema";
import { SlideCanvas } from "./SlideCanvas";

type Props = {
  list: Template[];
  index: number;
  selected: string;
  brand?: Brand;
  /** Preview the user's own deck when there is one; otherwise a sample deck. */
  deck?: Deck;
  onIndex: (i: number) => void;
  onUse: (id: string) => void;
  onClose: () => void;
};

/** Full-screen "try before you use" preview of a template across every layout. */
export function TemplatePreview({ list, index, selected, brand, deck, onIndex, onUse, onClose }: Props) {
  const base = list[index];
  const t = applyBrand(base, brand);
  const preview = deck?.slides.length ? deck : SAMPLE_DECK;
  const [slide, setSlide] = useState(0);
  const [auto, setAuto] = useState(true);
  const n = preview.slides.length;

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % n), 2600);
    return () => clearInterval(id);
  }, [auto, n]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") {
        setAuto(false);
        setSlide((s) => (s + 1) % n);
      } else if (e.key === "ArrowLeft") {
        setAuto(false);
        setSlide((s) => (s - 1 + n) % n);
      } else if (e.key === "ArrowDown") onIndex((index + 1) % list.length);
      else if (e.key === "ArrowUp") onIndex((index - 1 + list.length) % list.length);
      else if (e.key === "Enter") onUse(base.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n, index, list.length, onIndex, onUse, onClose, base.id]);

  const isCurrent = selected === base.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div className="rise flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-3xl border-[1.5px] border-ink bg-card shadow-[8px_8px_0_var(--color-ink)]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 border-b-[1.5px] border-ink px-5 py-3">
          <button className="ghost-btn px-2!" onClick={() => onIndex((index - 1 + list.length) % list.length)} title="Previous template (↑)">
            ‹
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-display text-xl font-bold tracking-tight">{base.name}</h3>
              <span className="rounded-full bg-paper-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-mute">{base.category}</span>
              {base.art && <span className="rounded-full bg-ember-soft px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ember">✦ {ART_LABELS[base.art]}</span>}
              {isCurrent && <span className="rounded-full bg-ink px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-paper">In use</span>}
            </div>
            <p className="truncate text-xs text-mute">
              {base.vibe ?? `${base.heading} headings · ${base.body} body`} · {index + 1} of {list.length}
            </p>
          </div>
          <button className="ghost-btn px-2!" onClick={() => onIndex((index + 1) % list.length)} title="Next template (↓)">
            ›
          </button>
          <button className="ghost-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_260px]">
          {/* Stage */}
          <div className="flex min-w-0 flex-col gap-4 bg-paper p-4 sm:p-6">
            <div className="relative overflow-hidden rounded-xl border-[1.5px] border-ink shadow-[0_24px_60px_-20px_rgba(18,35,90,0.5)]">
              <div key={`${base.id}-${slide}`} className="rise">
                <SlideCanvas slide={preview.slides[slide]} template={t} index={slide} total={n} />
              </div>
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-3 py-2 text-white opacity-70 backdrop-blur hover:opacity-100"
                onClick={() => {
                  setAuto(false);
                  setSlide((s) => (s - 1 + n) % n);
                }}
              >
                ←
              </button>
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-3 py-2 text-white opacity-70 backdrop-blur hover:opacity-100"
                onClick={() => {
                  setAuto(false);
                  setSlide((s) => (s + 1) % n);
                }}
              >
                →
              </button>
            </div>
            {/* Filmstrip */}
            <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
              {preview.slides.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setAuto(false);
                    setSlide(i);
                  }}
                  className={`w-28 shrink-0 overflow-hidden rounded-md border-2 transition ${i === slide ? "border-ember" : "border-transparent opacity-70 hover:opacity-100"}`}
                >
                  <SlideCanvas slide={s} template={t} index={i} total={n} />
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <aside className="flex flex-col gap-4 border-t-[1.5px] border-ink p-5 lg:border-l-[1.5px] lg:border-t-0">
            <div>
              <span className="label mb-2 block">Palette</span>
              <div className="flex gap-1.5">
                {[t.bg, t.text, t.accent, t.accent2, t.muted].map((c, i) => (
                  <span key={i} className="h-9 flex-1 rounded-lg border border-ink/15" style={{ background: `#${c}` }} title={`#${c}`} />
                ))}
              </div>
            </div>
            <div>
              <span className="label mb-2 block">Typography</span>
              <p className="text-2xl font-bold leading-tight" style={{ fontFamily: FONT_STACKS[t.heading] }}>
                Aa {t.heading}
              </p>
              <p className="text-sm text-ink-2" style={{ fontFamily: FONT_STACKS[t.body] }}>
                Body set in {t.body}
              </p>
            </div>
            <div>
              <span className="label mb-2 block">Includes</span>
              <ul className="space-y-1 text-sm text-ink-2">
                <li>✓ {n} layouts previewed</li>
                <li>✓ Native editable charts</li>
                {t.art && <li>✓ Illustrated backgrounds</li>}
                {(t.glass ?? 0) > 0.5 && <li>✓ Frosted glass cards</li>}
                {t.depth && <li>✓ 3D depth & shadows</li>}
              </ul>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-mute">
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} className="accent-[var(--color-ember)]" /> Auto-play slides
            </label>
            <div className="mt-auto space-y-2">
              <button className="ink-btn primary w-full justify-center py-3 text-base" onClick={() => onUse(base.id)}>
                {isCurrent ? "✓ Keep this template" : "✦ Use this template"}
              </button>
              <p className="text-center font-mono text-[10px] text-mute">← → slides · ↑ ↓ templates · Enter to use</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
