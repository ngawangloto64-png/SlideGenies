"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Deck } from "@/lib/schema";
import { applyBrand, getTemplate, type Brand } from "@/lib/templates";
import { decodeShare } from "@/lib/client";
import { exportPptx } from "@/lib/exportPptx";
import { Logo } from "@/components/Logo";
import { SlideCanvas } from "@/components/SlideCanvas";
import { Presenter, type PresentMode } from "@/components/Presenter";

/** Read-only viewer for share links (/view#<compressed deck>). */
export default function View() {
  const [data, setData] = useState<{ deck: Deck; templateId: string; brand?: Brand } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [present, setPresent] = useState<PresentMode | null>(null);
  const [start, setStart] = useState(0);

  useEffect(() => {
    const hash = location.hash.slice(1);
    if (!hash) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("This link has no deck in it.");
      return;
    }
    decodeShare(hash)
      .then(setData)
      .catch(() => setError("This share link is broken or incomplete."));
  }, []);

  if (error) return <div className="flex min-h-screen items-center justify-center font-display font-semibold tracking-tight text-3xl">{error}</div>;
  if (!data) return <div className="flex min-h-screen items-center justify-center font-mono text-sm text-mute">Opening deck…</div>;

  const template = applyBrand(getTemplate(data.templateId), data.brand);
  const { deck } = data;

  return (
    <div className="grain min-h-screen">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b-[1.5px] border-ink bg-paper/90 px-5 py-3 backdrop-blur">
        <Logo small />
        <span className="h-6 w-px bg-line" />
        <h1 className="min-w-0 flex-1 truncate font-display font-semibold tracking-tight text-xl">{deck.title}</h1>
        <span className="hidden rounded-full bg-paper-2 px-2.5 py-1 font-mono text-[11px] uppercase text-mute sm:inline">View only</span>
        <button className="ink-btn sm" onClick={() => exportPptx(deck, template)}>
          Download .pptx
        </button>
        <button className="ink-btn dark sm" onClick={() => setPresent("flythrough")}>
          ▶ Present
        </button>
      </header>
      <main className="mx-auto max-w-4xl space-y-8 px-5 py-10">
        {deck.slides.map((s, i) => (
          <button
            key={i}
            onClick={() => {
              setStart(i);
              setPresent("classic");
            }}
            className="block w-full overflow-hidden rounded-xl border-[1.5px] border-ink text-left shadow-[6px_6px_0_var(--color-ink)] transition hover:-translate-y-0.5"
          >
            <SlideCanvas slide={s} template={template} index={i} total={deck.slides.length} />
          </button>
        ))}
        <p className="text-center font-mono text-xs text-mute">
          Made with SlideGenie ·{" "}
          <Link href="/" className="underline">
            create your own deck
          </Link>
        </p>
      </main>
      {present && <Presenter deck={deck} template={template} start={start} mode={present} onClose={() => setPresent(null)} />}
    </div>
  );
}
