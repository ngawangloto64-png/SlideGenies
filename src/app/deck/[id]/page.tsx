"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LAYOUTS, LAYOUT_LABELS, VARIANTS, type Deck, type Slide } from "@/lib/schema";
import { applyBrand, getTemplate, type Brand } from "@/lib/templates";
import { encodeShare, library, streamJson, type DeckRecord } from "@/lib/client";
import { exportPptx } from "@/lib/exportPptx";
import { Logo } from "@/components/Logo";
import { SlideCanvas } from "@/components/SlideCanvas";
import { SlideEditor } from "@/components/SlideEditor";
import { TemplateGallery } from "@/components/TemplateGallery";
import { BrandKit } from "@/components/BrandKit";
import { GeniePanel, type GenieMsg } from "@/components/GeniePanel";
import { Presenter, type PresentMode } from "@/components/Presenter";

type Tab = "content" | "design" | "genie";

/** Keep only slides from a partial (streaming) deck that are complete enough to draw. */
function sanitize(partial: unknown): Deck {
  const d = (partial ?? {}) as Partial<Deck>;
  const slides = (d.slides ?? []).filter((s): s is Slide => !!s && typeof s.title === "string" && LAYOUTS.includes(s.layout as Slide["layout"]));
  return { title: d.title ?? "", slides };
}

/** Carry user-uploaded images over to AI-revised slides with the same title. */
function keepImages(prev: Deck, next: Deck): Deck {
  const byTitle = new Map(prev.slides.filter((s) => s.image).map((s) => [s.title, s.image]));
  return { ...next, slides: next.slides.map((s) => (s.layout === "imageText" && byTitle.has(s.title) ? { ...s, image: byTitle.get(s.title) } : s)) };
}

const AI_ACTIONS = [
  { label: "Reword", icon: "✦", prompt: "Rewrite this slide to be clearer and more compelling. Keep the same layout." },
  { label: "Tighten", icon: "−", prompt: "Make this slide much more concise: fewer, shorter points. Keep the same layout." },
  { label: "Elaborate", icon: "+", prompt: "Expand this slide with more specific detail and a concrete example. Keep the same layout." },
  { label: "Visualize", icon: "◐", prompt: "Make this slide more visual: switch to the best visual layout (cards with icons, stats, chart or timeline) for its content." },
];

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center font-mono text-sm text-mute">Opening studio…</div>}>
      <Studio />
    </Suspense>
  );
}

function Studio() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [rec, setRec] = useState<DeckRecord | null>(null);
  const [missing, setMissing] = useState(false);
  const [deck, setDeck] = useState<Deck>({ title: "", slides: [] });
  const [templateId, setTemplateId] = useState("midnight");
  const [brand, setBrand] = useState<Brand>({ enabled: false });
  const [current, setCurrent] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("content");
  const [designTab, setDesignTab] = useState<"themes" | "brand">("themes");
  const [present, setPresent] = useState<PresentMode | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [messages, setMessages] = useState<GenieMsg[]>([]);
  const [menu, setMenu] = useState<"export" | "present" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);
  const [drag, setDrag] = useState<number | null>(null);

  // Undo / redo history. Edits within the same group (e.g. typing in one field) collapse into one step.
  const past = useRef<Deck[]>([]);
  const future = useRef<Deck[]>([]);
  const lastGroup = useRef<{ key: string; at: number } | null>(null);
  const [, bump] = useState(0);
  const started = useRef(false);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 3200);
  }, []);

  const commit = useCallback((next: Deck | ((d: Deck) => Deck), group?: string) => {
    setDeck((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      const now = Date.now();
      const g = lastGroup.current;
      if (!(group && g && g.key === group && now - g.at < 1200)) {
        past.current = [...past.current.slice(-60), prev];
        future.current = [];
      }
      lastGroup.current = group ? { key: group, at: now } : null;
      return value;
    });
    bump((x) => x + 1);
  }, []);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    setDeck((cur) => {
      future.current.push(cur);
      return prev;
    });
    lastGroup.current = null;
    bump((x) => x + 1);
  }, []);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    setDeck((cur) => {
      past.current.push(cur);
      return next;
    });
    lastGroup.current = null;
    bump((x) => x + 1);
  }, []);

  /* ───────── Load + generate from the approved outline ───────── */
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const r = library.get(id);
    if (!r) {
      setMissing(true);
      return;
    }
    setRec(r);
    setDeck(r.deck);
    setTemplateId(r.templateId);
    setBrand(r.brand ?? { enabled: false });
    if (!r.pending) return;

    setGenerating(true);
    setDeck({ title: r.pending.outline.title, slides: [] });
    streamJson<Deck>("/api/generate", { outline: r.pending.outline, source: r.source, options: r.options }, (m) => {
      if (m.type === "error") return;
      const d = sanitize(m.data);
      setDeck({ title: d.title || r.pending!.outline.title, slides: d.slides });
    })
      .then(() => setRec((x) => (x ? { ...x, pending: undefined } : x)))
      .catch((e) => setError((e as Error).message))
      .finally(() => setGenerating(false));
  }, [id]);

  /* ───────── Autosave ───────── */
  useEffect(() => {
    if (!rec || generating) return;
    setSaved(false);
    const t = setTimeout(() => {
      const ok = library.save({ ...rec, deck, templateId, brand, pending: undefined });
      setSaved(ok);
      if (!ok) flash("Browser storage is full — remove some large images to keep autosaving.");
    }, 500);
    return () => clearTimeout(t);
  }, [deck, templateId, brand, rec, generating, flash]);

  /* ───────── Keyboard shortcuts ───────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input, textarea, select, [contenteditable]");
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (typing || present) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") setCurrent((c) => Math.min(c + 1, deck.slides.length - 1));
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") setCurrent((c) => Math.max(c - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, present, deck.slides.length]);

  const template = applyBrand(getTemplate(templateId), brand);
  const slides = deck.slides;
  const idx = Math.min(current, Math.max(slides.length - 1, 0));
  const active = slides[idx];

  const setSlide = (i: number, s: Slide, group?: string) => commit((d) => ({ ...d, slides: d.slides.map((x, k) => (k === i ? s : x)) }), group);
  const mutate = (fn: (s: Slide[]) => Slide[], next?: number) => {
    commit((d) => ({ ...d, slides: fn([...d.slides]) }));
    if (next !== undefined) setCurrent(next);
  };

  /* ───────── AI ───────── */
  async function revise(instruction: string, slideIndex: number | null) {
    const res = await fetch("/api/revise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deck, instruction, slideIndex, options: rec?.options }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error ?? "Revision failed");
    if (slideIndex !== null && j.slide) {
      const old = deck.slides[slideIndex];
      setSlide(slideIndex, { ...j.slide, image: j.slide.layout === "imageText" ? old.image : undefined });
    } else if (j.deck) {
      commit(keepImages(deck, j.deck));
      setCurrent((c) => Math.min(c, j.deck.slides.length - 1));
    }
    return (j.message as string) ?? "Done.";
  }

  async function quickAction(a: (typeof AI_ACTIONS)[number]) {
    setBusy(a.label);
    try {
      flash(await revise(a.prompt, idx));
    } catch (e) {
      flash((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function genieSend(text: string, scope: "slide" | "deck") {
    setMessages((m) => [...m, { role: "user", text, scope: scope === "slide" ? `Slide ${idx + 1}` : "Whole deck" }]);
    setBusy("Genie");
    try {
      const msg = await revise(text, scope === "slide" ? idx : null);
      setMessages((m) => [...m, { role: "ai", text: msg }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "ai", text: (e as Error).message, error: true }]);
    } finally {
      setBusy(null);
    }
  }

  function nextArrangement() {
    if (!active) return;
    const n = VARIANTS[active.layout] ?? 1;
    setSlide(idx, { ...active, variant: ((active.variant ?? 0) + 1) % n });
  }

  /* ───────── Export / share ───────── */
  async function doExport(kind: "pptx" | "pdf" | "gslides") {
    setMenu(null);
    if (kind === "pdf") {
      flash("Choose “Save as PDF” in the print dialog.");
      setTimeout(() => window.print(), 300);
      return;
    }
    setBusy("Exporting");
    try {
      await exportPptx(deck, template);
      if (kind === "gslides") flash("Downloaded .pptx — in Google Slides choose File → Import slides (or open it from Drive).");
    } finally {
      setBusy(null);
    }
  }

  async function share() {
    const hash = await encodeShare({ deck, templateId, brand });
    const url = `${location.origin}/view#${hash}`;
    try {
      await navigator.clipboard.writeText(url);
      flash(`Read-only link copied${deck.slides.some((s) => s.image) || brand.logo ? " (images aren't included in links)" : ""}.`);
    } catch {
      window.prompt("Copy this share link:", url);
    }
  }

  if (missing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-display font-semibold tracking-tight text-4xl">This deck isn’t in your library.</p>
        <p className="text-mute">Decks are saved in the browser where they were created.</p>
        <button className="ink-btn primary" onClick={() => router.push("/")}>
          Create a new deck
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="no-print flex h-screen flex-col">
        {/* ───────── Top bar ───────── */}
        <header className="relative z-30 flex items-center gap-3 border-b-[1.5px] border-ink bg-paper px-4 py-2.5">
          <Logo small />
          <span className="h-6 w-px bg-line" />
          <input
            value={deck.title}
            onChange={(e) => commit({ ...deck, title: e.target.value }, "title")}
            className="min-w-0 flex-1 truncate bg-transparent font-display font-semibold tracking-tight text-xl outline-none"
            placeholder="Untitled deck"
          />
          <span className="hidden font-mono text-[11px] text-mute md:inline">{generating ? `Designing slide ${slides.length + 1}…` : saved ? "● Saved" : "○ Saving…"}</span>
          <div className="flex items-center">
            <button className="ghost-btn" onClick={undo} disabled={!past.current.length || generating} title="Undo (⌘Z)">
              ↶
            </button>
            <button className="ghost-btn" onClick={redo} disabled={!future.current.length || generating} title="Redo (⇧⌘Z)">
              ↷
            </button>
          </div>
          <button className="ink-btn sm" onClick={share} disabled={!slides.length || generating}>
            Share
          </button>
          <div className="relative">
            <button className="ink-btn sm" onClick={() => setMenu(menu === "export" ? null : "export")} disabled={!slides.length || generating}>
              Export ▾
            </button>
            {menu === "export" && (
              <Menu onClose={() => setMenu(null)}>
                <MenuItem onClick={() => doExport("pptx")} title="Slide file (.pptx)" desc="Editable text, native charts, notes — opens in PowerPoint & Keynote" />
                <MenuItem onClick={() => doExport("pdf")} title="PDF" desc="One slide per page" />
                <MenuItem onClick={() => doExport("gslides")} title="For Google Slides" desc="Get a .pptx ready to import" />
              </Menu>
            )}
          </div>
          <div className="relative">
            <button className="ink-btn dark sm" onClick={() => setMenu(menu === "present" ? null : "present")} disabled={!slides.length}>
              ▶ Present ▾
            </button>
            {menu === "present" && (
              <Menu onClose={() => setMenu(null)}>
                <MenuItem
                  onClick={() => {
                    setMenu(null);
                    setPresent("classic");
                  }}
                  title="Classic"
                  desc="Full-screen, slide by slide"
                />
                <MenuItem
                  onClick={() => {
                    setMenu(null);
                    setPresent("flythrough");
                  }}
                  title="Fly-through"
                  desc="Glide across your story, then dive into each slide"
                />
              </Menu>
            )}
          </div>
        </header>
        {error && <div className="border-b-[1.5px] border-ink bg-red-50 px-4 py-2 text-center text-sm text-red-700">{error}</div>}

        <div className="flex min-h-0 flex-1">
          {/* ───────── Filmstrip ───────── */}
          <aside className="scrollbar-thin w-52 shrink-0 space-y-2.5 overflow-y-auto border-r-[1.5px] border-ink bg-paper-2 p-3">
            {slides.map((s, i) => (
              <div
                key={i}
                draggable={!generating}
                onDragStart={() => setDrag(i)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (drag !== null && drag !== i) {
                    commit((d) => {
                      const a = [...d.slides];
                      const [x] = a.splice(drag, 1);
                      a.splice(i, 0, x);
                      return { ...d, slides: a };
                    }, "reorder");
                    setDrag(i);
                    setCurrent(i);
                  }
                }}
                onDragEnd={() => setDrag(null)}
                onClick={() => setCurrent(i)}
                className={`rise flex cursor-pointer gap-2 ${drag === i ? "opacity-50" : ""}`}
              >
                <span className={`w-5 pt-0.5 text-right font-mono text-[11px] ${i === idx ? "font-bold text-ember" : "text-mute"}`}>{i + 1}</span>
                <span className={`block flex-1 overflow-hidden rounded-md border-[1.5px] transition ${i === idx ? "border-ink shadow-[3px_3px_0_var(--color-ember)]" : "border-line hover:border-ink"}`}>
                  <SlideCanvas slide={s} template={template} index={i} total={slides.length} />
                </span>
              </div>
            ))}
            {generating && (
              <div className="ml-7 aspect-video rounded-md border-[1.5px] border-dashed border-line">
                <div className="shimmer h-full w-full rounded-md" />
              </div>
            )}
            {!generating && (
              <button
                onClick={() => mutate((sl) => [...sl.slice(0, idx + 1), { layout: "bullets", title: "New slide", bullets: ["First point", "Second point", "Third point"] }, ...sl.slice(idx + 1)], idx + 1)}
                className="ml-7 w-[calc(100%-1.75rem)] rounded-md border-[1.5px] border-dashed border-ink/40 py-3 text-xs font-medium text-ink-2 hover:border-ink hover:bg-card"
              >
                + Slide
              </button>
            )}
          </aside>

          {/* ───────── Stage ───────── */}
          <main className="grain scrollbar-thin flex min-w-0 flex-1 flex-col items-center overflow-y-auto px-8 py-6">
            <div className="w-full max-w-5xl">
              {/* AI action bar */}
              <div className="mb-4 flex flex-wrap items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-card p-1.5 shadow-[3px_3px_0_var(--color-ink)]">
                <span className="pl-2 pr-1 font-mono text-[11px] uppercase tracking-wide text-mute">Genie</span>
                {AI_ACTIONS.map((a) => (
                  <button key={a.label} className="ghost-btn flex items-center gap-1" disabled={!active || !!busy || generating} onClick={() => quickAction(a)}>
                    <span className="text-ember">{busy === a.label ? "◌" : a.icon}</span> {a.label}
                  </button>
                ))}
                <span className="mx-1 h-5 w-px bg-line" />
                <button className="ghost-btn" disabled={!active || (VARIANTS[active.layout] ?? 1) < 2 || generating} onClick={nextArrangement} title="Try an alternate arrangement">
                  ⟳ New arrangement
                </button>
                <span className="ml-auto flex items-center">
                  <button className="ghost-btn" disabled={!active || generating} onClick={() => active && mutate((sl) => [...sl.slice(0, idx + 1), structuredClone(active), ...sl.slice(idx + 1)], idx + 1)} title="Duplicate">
                    ⧉
                  </button>
                  <button className="ghost-btn hover:bg-red-50! hover:text-red-600" disabled={slides.length <= 1 || generating} onClick={() => mutate((sl) => sl.filter((_, k) => k !== idx), Math.max(0, idx - 1))} title="Delete">
                    🗑
                  </button>
                </span>
              </div>

              {/* Canvas */}
              <div className="relative">
                {active ? (
                  <div className="overflow-hidden rounded-xl border-[1.5px] border-ink shadow-[8px_8px_0_var(--color-ink)]">
                    <SlideCanvas slide={active} template={template} index={idx} total={slides.length} />
                  </div>
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl border-[1.5px] border-ink bg-card shadow-[8px_8px_0_var(--color-ink)]">
                    <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-ember border-t-transparent" />
                    <span className="font-display font-semibold tracking-tight text-2xl">Designing your deck…</span>
                    <span className="font-mono text-xs text-mute">writing copy · picking layouts · building charts</span>
                  </div>
                )}
                {busy && busy !== "Exporting" && active && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-paper/60 backdrop-blur-[2px]">
                    <span className="flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-card px-4 py-2 text-sm font-semibold shadow-[3px_3px_0_var(--color-ink)]">
                      <span className="h-2 w-2 animate-ping rounded-full bg-ember" /> {busy === "Genie" ? "Genie is working its magic" : `${busy}…`}
                    </span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {active && (
                <div className="mt-6 rounded-2xl border-[1.5px] border-line bg-card p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="label">Speaker notes · slide {idx + 1}</span>
                    <span className="font-mono text-[10px] text-mute">{LAYOUT_LABELS[active.layout]}</span>
                  </div>
                  <textarea
                    value={active.notes ?? ""}
                    onChange={(e) => setSlide(idx, { ...active, notes: e.target.value }, `notes-${idx}`)}
                    rows={3}
                    placeholder="What will you say on this slide?"
                    className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none"
                  />
                </div>
              )}
            </div>
          </main>

          {/* ───────── Inspector ───────── */}
          <aside className="flex w-[340px] shrink-0 flex-col border-l-[1.5px] border-ink bg-paper">
            <div className="grid grid-cols-3 border-b-[1.5px] border-ink">
              {(
                [
                  ["content", "Content"],
                  ["design", "Design"],
                  ["genie", "✦ Genie"],
                ] as const
              ).map(([t, label]) => (
                <button key={t} onClick={() => setTab(t)} className={`py-3 text-sm font-semibold transition ${tab === t ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2"}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1">
              {tab === "content" && (
                <div className="scrollbar-thin h-full overflow-y-auto p-4">
                  {active && !generating ? (
                    <SlideEditor slide={active} onChange={(s) => setSlide(idx, s, `edit-${idx}`)} />
                  ) : (
                    <p className="text-sm text-mute">{generating ? "Editing unlocks when the deck is ready." : "No slide selected."}</p>
                  )}
                </div>
              )}
              {tab === "design" && (
                <div className="scrollbar-thin h-full overflow-y-auto p-4">
                  <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-paper-2 p-1 text-sm">
                    {(["themes", "brand"] as const).map((t) => (
                      <button key={t} onClick={() => setDesignTab(t)} className={`rounded-full py-1.5 font-medium ${designTab === t ? "bg-ink text-paper" : "text-ink-2"}`}>
                        {t === "themes" ? "Themes" : "Brand Vault"}
                      </button>
                    ))}
                  </div>
                  {designTab === "themes" ? (
                    <TemplateGallery selected={templateId} onSelect={setTemplateId} preview={active ?? slides[0]} deck={deck ?? undefined} brand={brand} cols="grid-cols-2" />
                  ) : (
                    <BrandKit brand={brand} onChange={setBrand} />
                  )}
                </div>
              )}
              {tab === "genie" && <GeniePanel messages={messages} busy={busy === "Genie"} currentSlide={idx} onSend={genieSend} />}
            </div>
          </aside>
        </div>

        {toast && (
          <div className="rise fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full border-[1.5px] border-ink bg-ink px-5 py-2.5 text-sm text-paper shadow-[3px_3px_0_var(--color-ember)]">{toast}</div>
        )}
      </div>

      {/* PDF export: every slide, one per page */}
      <div className="print-only">
        {slides.map((s, i) => (
          <div key={i} className="print-slide">
            <SlideCanvas slide={s} template={template} index={i} total={slides.length} width={960} />
          </div>
        ))}
      </div>

      {present && slides.length > 0 && <Presenter deck={deck} template={template} start={idx} mode={present} onClose={() => setPresent(null)} />}
    </>
  );
}

function Menu({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="rise absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border-[1.5px] border-ink bg-card p-1 shadow-[4px_4px_0_var(--color-ink)]">{children}</div>
    </>
  );
}

function MenuItem({ title, desc, onClick }: { title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="block w-full rounded-xl px-3 py-2 text-left transition hover:bg-paper-2">
      <span className="block text-sm font-semibold">{title}</span>
      <span className="block text-xs text-mute">{desc}</span>
    </button>
  );
}
