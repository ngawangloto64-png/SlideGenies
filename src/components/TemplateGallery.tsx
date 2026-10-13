"use client";

import { useState } from "react";
import { CATEGORIES, TEMPLATES, applyBrand, type Brand } from "@/lib/templates";
import type { Deck, Slide } from "@/lib/schema";
import { SlideCanvas } from "./SlideCanvas";
import { TemplatePreview } from "./TemplatePreview";

const SAMPLE: Slide = { layout: "title", title: "Your Big Idea", subtitle: "A presentation made in seconds" };

type Props = {
  selected: string;
  onSelect: (id: string) => void;
  /** Slide to show in thumbnails; defaults to a sample title slide. */
  preview?: Slide;
  /** The user's deck, shown in the full preview when available. */
  deck?: Deck;
  brand?: Brand;
  /** Tailwind grid-cols class. */
  cols?: string;
};

export function TemplateGallery({ selected, onSelect, preview = SAMPLE, deck, brand, cols = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" }: Props) {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [open, setOpen] = useState<number | null>(null);
  const list = cat === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === cat);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => {
          const count = c === "All" ? TEMPLATES.length : TEMPLATES.filter((t) => t.category === c).length;
          if (!count) return null;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border-[1.5px] px-3 py-1 text-xs font-medium transition ${cat === c ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink-2 hover:border-ink"}`}
            >
              {["3D", "Robotic", "Science", "Futuristic", "Abstract"].includes(c) && <span className="mr-1 text-[#FFB020]">✦</span>}
              {c}
              <span className="ml-1 opacity-50">{count}</span>
            </button>
          );
        })}
      </div>
      <div className={`grid gap-3 ${cols}`}>
        {list.map((t, i) => {
          const active = selected === t.id;
          return (
            <div
              key={t.id}
              className={`group relative overflow-hidden rounded-xl border-[1.5px] text-left transition ${
                active ? "border-ink shadow-[4px_4px_0_var(--color-ember)]" : "border-line hover:-translate-y-0.5 hover:border-ink hover:shadow-[4px_4px_0_var(--color-ink)]"
              }`}
            >
              <button className="block w-full text-left" onClick={() => setOpen(i)} title={`Preview ${t.name}`}>
                <SlideCanvas slide={preview} template={applyBrand(t, brand)} />
                <div className="flex items-center justify-between gap-2 border-t-[1.5px] border-line bg-card px-2.5 py-1.5">
                  <span className="min-w-0 truncate text-xs font-semibold">{t.name}</span>
                  <span className="flex shrink-0 -space-x-1">
                    {[t.bg, t.accent, t.accent2].map((c, k) => (
                      <span key={k} className="h-3 w-3 rounded-full border border-ink/20" style={{ background: `#${c}` }} />
                    ))}
                  </span>
                </div>
              </button>
              {/* Hover actions */}
              <div className="pointer-events-none absolute inset-x-0 top-0 flex aspect-video items-center justify-center gap-1.5 bg-ink/45 opacity-0 backdrop-blur-[2px] transition group-hover:pointer-events-auto group-hover:opacity-100">
                <button className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow" onClick={() => setOpen(i)}>
                  👁 Preview
                </button>
                <button className="rounded-full bg-ember px-3 py-1.5 text-xs font-semibold text-white shadow" onClick={() => onSelect(t.id)}>
                  {active ? "✓ In use" : "Use"}
                </button>
              </div>
              {t.art && <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/55 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur">{t.category}</span>}
              {active && <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-ember px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">✓</span>}
            </div>
          );
        })}
      </div>
      {open !== null && list[open] && (
        <TemplatePreview
          list={list}
          index={open}
          selected={selected}
          brand={brand}
          deck={deck}
          onIndex={setOpen}
          onUse={(id) => {
            onSelect(id);
            setOpen(null);
          }}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}
