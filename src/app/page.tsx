"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LAYOUTS, LAYOUT_LABELS, type Density, type GenOptions, type Outline, type OutlineSlide, type Source } from "@/lib/schema";
import { TEMPLATES, applyBrand, getTemplate, type Brand } from "@/lib/templates";
import { library, newId, streamJson, type DeckRecord } from "@/lib/client";
import { Logo } from "@/components/Logo";
import { SlideCanvas } from "@/components/SlideCanvas";
import { TemplateGallery } from "@/components/TemplateGallery";
import { BrandKit } from "@/components/BrandKit";

const SPARKS = [
  { emoji: "🚀", text: "Seed pitch deck for an AI-powered fitness coach app", tag: "Pitch" },
  { emoji: "🌍", text: "The state of renewable energy in 2030, with market data", tag: "Report" },
  { emoji: "🎓", text: "Teach high-school students how neural networks learn", tag: "Lesson" },
  { emoji: "📊", text: "Q3 marketing results and the Q4 growth plan", tag: "Business" },
  { emoji: "🏛️", text: "The rise and fall of the Roman Empire in 10 slides", tag: "History" },
  { emoji: "🧘", text: "Workshop: building healthy remote-work habits for teams", tag: "Workshop" },
];
const TONES = ["Professional", "Inspiring", "Casual", "Persuasive", "Academic", "Playful"];
const LANGS = ["English", "Spanish", "French", "German", "Portuguese", "Italian", "Hindi", "Japanese", "Chinese", "Arabic", "Indonesian"];
const FEATURES = [
  ["Story map first", "Shape the narrative card by card before any design happens."],
  ["Ask Peti", "Describe a change in plain words — one slide or the whole deck."],
  ["Brand Vault", `Store your logo, colors and fonts once; apply them to all ${TEMPLATES.length} themes.`],
  ["Real charts", "Bar, line and pie charts that stay editable after download."],
  ["Fly-through", "Present on a winding canvas that glides from slide to slide."],
  ["PPTX · PDF · Link", "Export anywhere, or share a read-only link."],
];

type Stage = "compose" | "outline";

function reorder<T>(arr: T[], from: number, to: number) {
  const a = [...arr];
  const [x] = a.splice(from, 1);
  a.splice(to, 0, x);
  return a;
}

export default function Home() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("compose");
  const [mode, setMode] = useState<Source["mode"]>("prompt");
  const [prompt, setPrompt] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<{ name: string; chars: number; truncated: boolean } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [opts, setOpts] = useState<GenOptions>({ slideCount: 8, tone: "Professional", audience: "", density: "Balanced", language: "English" });

  const [outline, setOutline] = useState<Outline | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState("midnight");
  const [brand, setBrand] = useState<Brand>({ enabled: false });
  const [sideTab, setSideTab] = useState<"themes" | "brand">("themes");
  const [decks, setDecks] = useState<DeckRecord[]>([]);
  const [drag, setDrag] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Read the deck library after mount (localStorage is client-only).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDecks(library.list());
  }, []);

  const source: Source = { mode, prompt, text: mode === "prompt" ? undefined : text, fileName: mode === "file" ? file?.name : undefined };
  const canSubmit = (mode === "prompt" ? prompt.trim() : text.trim()) && !loading && !uploading;

  async function upload(f: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/extract", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setText(j.text);
      setFile({ name: f.name, chars: j.chars, truncated: j.truncated });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function draftOutline() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    setOutline({ title: prompt || file?.name || "Untitled", slides: [] });
    setStage("outline");
    try {
      await streamJson<Outline>("/api/outline", { source, options: opts }, (m) => {
        if (m.type === "error") return;
        const o = m.data;
        setOutline({ title: o?.title ?? "", slides: (o?.slides ?? []).filter((s): s is OutlineSlide => !!s?.title).map((s) => ({ ...s, layout: s.layout ?? "bullets", points: (s.points ?? []).filter(Boolean) })) });
      });
    } catch (e) {
      setError((e as Error).message);
      setStage((s) => (outline?.slides.length ? s : "compose"));
    } finally {
      setLoading(false);
    }
  }

  function generateDeck() {
    if (!outline?.slides.length) return;
    const id = newId();
    library.save({
      id,
      deck: { title: outline.title, slides: [] },
      templateId,
      brand,
      options: opts,
      source: { ...source, text: source.text?.slice(0, 60000) },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pending: { outline },
    });
    router.push(`/deck/${id}`);
  }

  const updateSlide = (i: number, patch: Partial<OutlineSlide>) => setOutline((o) => (o ? { ...o, slides: o.slides.map((s, k) => (k === i ? { ...s, ...patch } : s)) } : o));
  const themed = applyBrand(getTemplate(templateId), brand);

  /* ───────────────────────────── Story map (outline) ───────────────────────────── */
  if (stage === "outline" && outline) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-20 border-b-[1.5px] border-ink bg-paper/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3">
            <Logo small />
            <Steps step={2} />
            <div className="ml-auto flex items-center gap-2">
              <button className="ghost-btn" onClick={() => setStage("compose")} disabled={loading}>
                ← Edit source
              </button>
              <button className="ghost-btn" onClick={draftOutline} disabled={loading}>
                ↻ Redraft
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[1fr_400px]">
          <main>
            <span className="label">Story map</span>
            <input
              value={outline.title}
              onChange={(e) => setOutline({ ...outline, title: e.target.value })}
              className="mt-1 w-full bg-transparent font-display font-semibold tracking-tight text-4xl leading-tight outline-none sm:text-5xl"
              placeholder="Deck title"
            />
            <p className="mt-2 text-sm text-mute">
              {loading ? "Peti is mapping your story…" : "Drag to reorder, rewrite headlines, swap layouts — then generate. Every card becomes one slide."}
            </p>
            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <ol className="mt-6 space-y-3">
              {outline.slides.map((s, i) => (
                <li
                  key={i}
                  draggable={!loading}
                  onDragStart={() => setDrag(i)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (drag !== null && drag !== i) {
                      setOutline({ ...outline, slides: reorder(outline.slides, drag, i) });
                      setDrag(i);
                    }
                  }}
                  onDragEnd={() => setDrag(null)}
                  className={`rise group grid grid-cols-[56px_1fr] gap-3 rounded-2xl border-[1.5px] bg-card p-4 transition ${drag === i ? "border-ember opacity-60" : "border-ink shadow-[3px_3px_0_var(--color-ink)]"}`}
                  style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="font-display font-semibold tracking-tight text-4xl leading-none text-ember">{String(i + 1).padStart(2, "0")}</span>
                    <span className="cursor-grab text-mute opacity-0 transition group-hover:opacity-100" title="Drag to reorder">
                      ⠿
                    </span>
                  </div>
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <input value={s.title} onChange={(e) => updateSlide(i, { title: e.target.value })} className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none" />
                      <select value={s.layout} onChange={(e) => updateSlide(i, { layout: e.target.value as OutlineSlide["layout"] })} className="rounded-full border-[1.5px] border-line bg-paper px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide outline-none hover:border-ink">
                        {LAYOUTS.map((l) => (
                          <option key={l} value={l}>
                            {LAYOUT_LABELS[l]}
                          </option>
                        ))}
                      </select>
                      <button className="ghost-btn px-2! text-mute opacity-0 group-hover:opacity-100" onClick={() => setOutline({ ...outline, slides: outline.slides.filter((_, k) => k !== i) })} title="Delete">
                        ✕
                      </button>
                    </div>
                    <textarea
                      value={s.points.join("\n")}
                      onChange={(e) => updateSlide(i, { points: e.target.value.split("\n") })}
                      rows={Math.max(2, s.points.length)}
                      className="w-full resize-none rounded-lg bg-transparent text-sm leading-relaxed text-ink-2 outline-none focus:bg-paper"
                    />
                  </div>
                </li>
              ))}
              {loading && (
                <li className="h-28 rounded-2xl border-[1.5px] border-dashed border-line">
                  <div className="shimmer h-full w-full rounded-2xl" />
                </li>
              )}
            </ol>
            {!loading && (
              <button
                className="mt-3 w-full rounded-2xl border-[1.5px] border-dashed border-ink/40 py-4 text-sm font-medium text-ink-2 transition hover:border-ink hover:bg-card"
                onClick={() => setOutline({ ...outline, slides: [...outline.slides.slice(0, -1), { title: "New slide", layout: "bullets", points: ["Key point"] }, ...outline.slides.slice(-1)] })}
              >
                + Add a card
              </button>
            )}
          </main>

          <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
            <div className="ink-card flex h-full flex-col overflow-hidden">
              <div className="border-b-[1.5px] border-ink p-4">
                <div className="overflow-hidden rounded-lg border-[1.5px] border-ink">
                  <SlideCanvas slide={{ layout: "title", title: outline.title || "Your deck", subtitle: `${outline.slides.length} slides · ${opts.tone}` }} template={themed} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-paper-2 p-1 text-sm">
                  {(["themes", "brand"] as const).map((t) => (
                    <button key={t} onClick={() => setSideTab(t)} className={`rounded-full py-1.5 font-medium ${sideTab === t ? "bg-ink text-paper" : "text-ink-2"}`}>
                      {t === "themes" ? "Themes" : "Brand Vault"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
                {sideTab === "themes" ? (
                  <TemplateGallery selected={templateId} onSelect={setTemplateId} brand={brand} cols="grid-cols-2" preview={{ layout: "title", title: outline.title || "Your deck" }} />
                ) : (
                  <BrandKit brand={brand} onChange={setBrand} />
                )}
              </div>
              <div className="border-t-[1.5px] border-ink p-4">
                <button className="ink-btn primary w-full justify-center py-3 text-base" disabled={loading || !outline.slides.length} onClick={generateDeck}>
                  ✦ Generate {outline.slides.length} slides
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  /* ───────────────────────────── Composer ───────────────────────────── */
  return (
    <div className="grain min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-1 text-sm">
          <a href="#library" className="ghost-btn">
            Library
          </a>
          <a href="#themes" className="ghost-btn">
            Themes
          </a>
          <span className="ml-2 hidden rounded-full border-[1.5px] border-ink bg-lime px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide sm:inline">{TEMPLATES.length} themes · PPTX · PDF</span>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-5 pb-10 pt-8 text-center sm:pt-14">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-card px-3 py-1 text-xs font-semibold shadow-[2px_2px_0_var(--color-ink)]">
          <span className="text-[#FFB020]">✦</span> AI presentation generator
        </span>
        <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl">
          Ideas to{" "}
          <span className="relative inline-block text-brand">
            Slides
            <svg className="absolute -bottom-1.5 left-0 w-full" viewBox="0 0 200 12" preserveAspectRatio="none">
              <path d="M2 9 C 50 2, 150 2, 198 8" stroke="#FFB020" strokeWidth="4" fill="none" strokeLinecap="round" />
            </svg>
            <span className="absolute -right-7 -top-3 text-3xl text-[#FFB020] sm:-right-9 sm:text-4xl">✦</span>
          </span>
          ,<br className="sm:hidden" /> Instantly.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-ink-2">Prompt it, paste your notes, or drop a document. Peti maps out your story, designs every slide, and hands back a fully editable deck.</p>
      </section>

      <section className="mx-auto max-w-4xl px-5">
        {/* Folder tabs */}
        <div className="flex gap-1 pl-4">
          {(
            [
              ["prompt", "✦ Prompt"],
              ["text", "¶ Paste text"],
              ["file", "⇪ Upload doc"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`relative -mb-[1.5px] rounded-t-xl border-[1.5px] px-4 py-2 text-sm font-semibold transition ${mode === m ? "z-10 border-ink border-b-card bg-card" : "border-transparent text-mute hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="ink-card p-5 sm:p-6">
          {mode === "prompt" && (
            <textarea
              autoFocus
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.metaKey || e.ctrlKey) && draftOutline()}
              rows={3}
              placeholder="Describe your presentation… e.g. “A 10-slide investor pitch for a sustainable coffee subscription”"
              className="w-full resize-none bg-transparent font-display font-semibold tracking-tight text-2xl leading-snug outline-none placeholder:text-mute/60 sm:text-3xl"
            />
          )}
          {mode === "text" && (
            <div className="space-y-3">
              <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Optional: what should the deck focus on?" className="field" />
              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder="Paste notes, an article, a report, meeting minutes… PePeTi turns long text into a structured deck."
                className="field resize-y font-mono text-[13px] leading-relaxed"
              />
              <p className="text-right font-mono text-[11px] text-mute">{text.length.toLocaleString()} chars</p>
            </div>
          )}
          {mode === "file" && (
            <div className="space-y-3">
              <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Optional: what should the deck focus on?" className="field" />
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f) upload(f);
                }}
                onClick={() => fileRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-ink/40 bg-paper px-6 py-10 text-center transition hover:border-ink"
              >
                {uploading ? (
                  <span className="text-sm text-mute">Reading document…</span>
                ) : file ? (
                  <>
                    <span className="text-3xl">📄</span>
                    <span className="font-semibold">{file.name}</span>
                    <span className="font-mono text-xs text-mute">
                      {file.chars.toLocaleString()} characters extracted{file.truncated ? " (first 60k used)" : ""} · click to replace
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl">⇪</span>
                    <span className="font-semibold">Drop a PDF, Word doc or text file</span>
                    <span className="font-mono text-xs text-mute">PDF · DOCX · TXT · MD · CSV · HTML — up to 20 MB</span>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" hidden accept=".pdf,.docx,.txt,.md,.markdown,.csv,.html,.htm,.json" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </div>
          )}

          {/* Settings */}
          <div className="mt-5 grid gap-4 border-t-[1.5px] border-dashed border-line pt-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="label mb-1.5 block">Slides</span>
              <div className="flex items-center rounded-full border-[1.5px] border-line bg-paper">
                <button className="px-3 py-1.5 text-lg" onClick={() => setOpts({ ...opts, slideCount: Math.max(3, opts.slideCount - 1) })}>
                  −
                </button>
                <span className="flex-1 text-center font-mono font-semibold">{opts.slideCount}</span>
                <button className="px-3 py-1.5 text-lg" onClick={() => setOpts({ ...opts, slideCount: Math.min(25, opts.slideCount + 1) })}>
                  +
                </button>
              </div>
            </div>
            <div>
              <span className="label mb-1.5 block">Text density</span>
              <div className="grid grid-cols-3 rounded-full border-[1.5px] border-line bg-paper p-0.5 text-xs">
                {(["Minimal", "Balanced", "Detailed"] as Density[]).map((d) => (
                  <button key={d} onClick={() => setOpts({ ...opts, density: d })} className={`rounded-full py-1.5 font-medium ${opts.density === d ? "bg-ink text-paper" : "text-ink-2"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <label>
              <span className="label mb-1.5 block">Tone</span>
              <select className="field rounded-full! py-1.5!" value={opts.tone} onChange={(e) => setOpts({ ...opts, tone: e.target.value })}>
                {TONES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="label mb-1.5 block">Language</span>
              <select className="field rounded-full! py-1.5!" value={opts.language} onChange={(e) => setOpts({ ...opts, language: e.target.value })}>
                {LANGS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="sm:col-span-2 lg:col-span-3">
              <span className="label mb-1.5 block">Audience</span>
              <input className="field rounded-full! py-1.5!" value={opts.audience} onChange={(e) => setOpts({ ...opts, audience: e.target.value })} placeholder="Investors, students, executives, customers…" />
            </label>
            <div className="flex items-end">
              <button className="ink-btn primary w-full justify-center py-2.5" disabled={!canSubmit} onClick={draftOutline}>
                Draft outline →
              </button>
            </div>
          </div>
          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        {/* Sparks */}
        <div className="mt-10">
          <span className="label">Not sure where to start? Try one of these</span>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SPARKS.map((s, i) => (
              <button
                key={s.text}
                onClick={() => {
                  setMode("prompt");
                  setPrompt(s.text);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="group rounded-2xl border-[1.5px] border-ink bg-card p-4 text-left transition hover:-translate-y-1 hover:rotate-0 hover:shadow-[4px_4px_0_var(--color-ink)]"
                style={{ transform: `rotate(${[-1.2, 0.8, -0.6, 1, -0.9, 0.5][i]}deg)` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{s.emoji}</span>
                  <span className="rounded-full bg-paper-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-mute">{s.tag}</span>
                </div>
                <p className="mt-2 text-sm font-medium leading-snug">{s.text}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto mt-20 max-w-6xl px-5">
        <div className="grid overflow-hidden rounded-3xl border-[1.5px] border-ink bg-ink sm:grid-cols-2 lg:grid-cols-3" style={{ gap: "1.5px" }}>
          {FEATURES.map(([t, d], i) => (
            <div key={t} className="bg-card p-6">
              <span className="font-mono text-xs text-ember">0{i + 1}</span>
              <h3 className="mt-1 font-display font-semibold tracking-tight text-2xl">{t}</h3>
              <p className="mt-1 text-sm text-ink-2">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Library */}
      <section id="library" className="mx-auto mt-20 max-w-6xl scroll-mt-6 px-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display font-semibold tracking-tight text-4xl">Your library</h2>
          <span className="font-mono text-xs text-mute">{decks.length} decks · saved in this browser</span>
        </div>
        {decks.length === 0 ? (
          <p className="mt-4 rounded-2xl border-[1.5px] border-dashed border-line p-8 text-center text-sm text-mute">Decks you create appear here, autosaved.</p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {decks.map((d) => (
              <div key={d.id} className="group relative">
                <button onClick={() => router.push(`/deck/${d.id}`)} className="block w-full overflow-hidden rounded-xl border-[1.5px] border-ink text-left transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--color-ink)]">
                  {d.deck.slides[0] ? (
                    <SlideCanvas slide={d.deck.slides[0]} template={applyBrand(getTemplate(d.templateId), d.brand)} />
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-paper-2 text-sm text-mute">Not generated yet</div>
                  )}
                  <div className="border-t-[1.5px] border-ink bg-card px-3 py-2">
                    <p className="truncate text-sm font-semibold">{d.deck.title || "Untitled"}</p>
                    <p className="font-mono text-[11px] text-mute">
                      {d.deck.slides.length} slides · {new Date(d.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </button>
                <button
                  className="absolute right-2 top-2 rounded-full border-[1.5px] border-ink bg-card px-2 py-0.5 text-xs opacity-0 transition group-hover:opacity-100"
                  onClick={() => {
                    if (confirm(`Delete “${d.deck.title}”?`)) {
                      library.remove(d.id);
                      setDecks(library.list());
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Themes */}
      <section id="themes" className="mx-auto mt-20 max-w-6xl scroll-mt-6 px-5 pb-24">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display font-semibold tracking-tight text-4xl">
            {TEMPLATES.length} themes, <span className="text-brand">one click</span>
          </h2>
          <span className="text-sm text-mute">
            Default theme: <b className="text-ink">{getTemplate(templateId).name}</b> — switch any time
          </span>
        </div>
        <TemplateGallery selected={templateId} onSelect={setTemplateId} />
      </section>

      <footer className="border-t-[1.5px] border-ink py-6 text-center font-mono text-xs text-mute">PePeTi — Ideas to Slides, Instantly. Downloads open in any major slide app.</footer>
    </div>
  );
}

function Steps({ step }: { step: number }) {
  return (
    <ol className="hidden items-center gap-2 font-mono text-[11px] uppercase tracking-wide md:flex">
      {["Idea", "Story map", "Studio"].map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span className={`flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-ink text-[10px] ${i + 1 < step ? "bg-ink text-paper" : i + 1 === step ? "bg-ember text-white" : ""}`}>{i + 1 < step ? "✓" : i + 1}</span>
          <span className={i + 1 === step ? "text-ink" : "text-mute"}>{s}</span>
          {i < 2 && <span className="text-mute">—</span>}
        </li>
      ))}
    </ol>
  );
}
