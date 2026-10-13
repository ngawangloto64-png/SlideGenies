"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Deck } from "@/lib/schema";
import type { ThemedTemplate } from "@/lib/templates";
import { H, W } from "@/lib/layout";
import { SlideCanvas } from "./SlideCanvas";

export type PresentMode = "classic" | "flythrough";

type Props = { deck: Deck; template: ThemedTemplate; start: number; mode: PresentMode; onClose: () => void };

/** Canvas positions for fly-through mode: a gently winding path with slight rotations. */
function flightPath(n: number) {
  const cols = Math.max(2, Math.ceil(Math.sqrt(n * 1.6)));
  return Array.from({ length: n }, (_, i) => {
    const row = Math.floor(i / cols);
    const colRaw = i % cols;
    const col = row % 2 ? cols - 1 - colRaw : colRaw; // snake path
    return {
      x: col * (W + 260) + (row % 2 ? 80 : 0),
      y: row * (H + 260) + (col % 2 ? 90 : 0),
      r: [-4, 3, -2, 5, -3, 2][i % 6],
    };
  });
}

export function Presenter({ deck, template, start, mode, onClose }: Props) {
  const n = deck.slides.length;
  const [i, setI] = useState(start);
  const [overview, setOverview] = useState(mode === "flythrough");
  const [size, setSize] = useState({ w: 1280, h: 720 });
  const [showNotes, setShowNotes] = useState(false);

  const next = useCallback(() => {
    if (overview) return setOverview(false);
    setI((x) => Math.min(x + 1, n - 1));
  }, [overview, n]);
  const prev = useCallback(() => setI((x) => Math.max(x - 1, 0)), []);

  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    document.documentElement.requestFullscreen?.().catch(() => {});
    // Fly-through opens on the overview, then flies into the first slide.
    const t = mode === "flythrough" ? setTimeout(() => setOverview(false), 900) : undefined;
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", update);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", " ", "PageDown", "Enter"].includes(e.key)) next();
      else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) prev();
      else if (e.key === "Escape") onClose();
      else if (e.key.toLowerCase() === "o" && mode === "flythrough") setOverview((v) => !v);
      else if (e.key.toLowerCase() === "n") setShowNotes((v) => !v);
      else if (e.key === "Home") setI(0);
      else if (e.key === "End") setI(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose, mode, n]);

  const pos = useMemo(() => flightPath(n), [n]);

  const camera = useMemo(() => {
    if (mode !== "flythrough") return "";
    if (overview) {
      const xs = pos.map((p) => p.x),
        ys = pos.map((p) => p.y);
      const minX = Math.min(...xs) - W / 2 - 100,
        maxX = Math.max(...xs) + W / 2 + 100;
      const minY = Math.min(...ys) - H / 2 - 100,
        maxY = Math.max(...ys) + H / 2 + 100;
      const s = Math.min(size.w / (maxX - minX), size.h / (maxY - minY));
      return `scale(${s}) translate(${-(minX + maxX) / 2}px, ${-(minY + maxY) / 2}px)`;
    }
    const p = pos[i];
    const s = Math.min(size.w / W, size.h / H) * 0.96;
    return `scale(${s}) rotate(${-p.r}deg) translate(${-p.x}px, ${-p.y}px)`;
  }, [mode, overview, pos, i, size]);

  const width = Math.min(size.w, (size.h * 16) / 9);
  const notes = deck.slides[i]?.notes;

  return (
    <div className="fixed inset-0 z-50 select-none overflow-hidden bg-[#0d0c0b]" onClick={next}>
      {mode === "flythrough" ? (
        <div className="absolute left-1/2 top-1/2" style={{ transform: camera, transformOrigin: "0 0", transition: "transform 1.1s cubic-bezier(0.65, 0, 0.25, 1)" }}>
          {deck.slides.map((s, k) => (
            <div
              key={k}
              className="absolute"
              style={{
                left: pos[k].x - W / 2,
                top: pos[k].y - H / 2,
                transform: `rotate(${pos[k].r}deg)`,
                boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
                opacity: overview || k === i ? 1 : 0.35,
                transition: "opacity 0.8s",
              }}
              onClick={(e) => {
                if (!overview) return;
                e.stopPropagation();
                setI(k);
                setOverview(false);
              }}
            >
              <SlideCanvas slide={s} template={template} index={k} total={n} width={W} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <div key={i} className="rise">
            <SlideCanvas slide={deck.slides[i]} template={template} index={i} total={n} width={width} />
          </div>
        </div>
      )}

      {showNotes && notes && (
        <div className="absolute bottom-16 left-1/2 max-w-3xl -translate-x-1/2 rounded-2xl bg-black/75 px-5 py-3 text-sm text-white/90 backdrop-blur" onClick={(e) => e.stopPropagation()}>
          {notes}
        </div>
      )}

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/10 p-1 font-mono text-xs text-white/80 backdrop-blur" onClick={(e) => e.stopPropagation()}>
        <button className="rounded-full px-3 py-1.5 hover:bg-white/15" onClick={prev}>
          ←
        </button>
        <span className="px-2">
          {i + 1} / {n}
        </span>
        <button className="rounded-full px-3 py-1.5 hover:bg-white/15" onClick={next}>
          →
        </button>
        {mode === "flythrough" && (
          <button className={`rounded-full px-3 py-1.5 hover:bg-white/15 ${overview ? "bg-white/20" : ""}`} onClick={() => setOverview((v) => !v)}>
            ⊞ Map (O)
          </button>
        )}
        <button className={`rounded-full px-3 py-1.5 hover:bg-white/15 ${showNotes ? "bg-white/20" : ""}`} onClick={() => setShowNotes((v) => !v)}>
          Notes (N)
        </button>
        <button className="rounded-full px-3 py-1.5 hover:bg-white/15" onClick={onClose}>
          Exit
        </button>
      </div>
    </div>
  );
}
