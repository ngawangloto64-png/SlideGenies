"use client";

import { useRef } from "react";
import { LAYOUTS, LAYOUT_LABELS, type Chart, type Layout, type Slide } from "@/lib/schema";
import { loadImage } from "@/lib/client";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label mb-1.5 flex justify-between">
        {label}
        {hint && <span className="normal-case tracking-normal opacity-70">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

const lines = (v: string) => v.split("\n");
const join = (v?: string[]) => (v ?? []).join("\n");

const ICONS = ["🚀", "🎯", "💡", "📈", "🤝", "⚙️", "🌱", "🔒", "🧭", "⭐", "💰", "🧠", "📊", "🌍", "⚡", "🛡️", "👥", "🏆"];

/** Fill in sensible content when switching to a layout whose fields are empty. */
export function withLayout(s: Slide, layout: Layout): Slide {
  const next: Slide = { ...s, layout, variant: 0 };
  const pool = s.bullets ?? s.items?.map((i) => `${i.heading}: ${i.text}`) ?? s.left?.bullets ?? s.stats?.map((x) => `${x.value} ${x.label}`) ?? ["Point one", "Point two", "Point three"];
  if ((layout === "bullets" || layout === "imageText") && !next.bullets?.length) next.bullets = pool;
  if ((layout === "cards" || layout === "timeline") && !next.items?.length)
    next.items = pool.slice(0, 4).map((p, i) => {
      const [h, ...r] = p.split(":");
      return { heading: h.trim().slice(0, 30), text: r.join(":").trim() || p, icon: ICONS[i] };
    });
  if (layout === "twoColumn" && !next.left) {
    const half = Math.ceil(pool.length / 2);
    next.left = { heading: "Before", bullets: pool.slice(0, half) };
    next.right = { heading: "After", bullets: pool.slice(half) };
  }
  if (layout === "stats" && !next.stats?.length)
    next.stats = [
      { value: "10x", label: "Metric one" },
      { value: "85%", label: "Metric two" },
      { value: "24/7", label: "Metric three" },
    ];
  if (layout === "chart" && !next.chart)
    next.chart = { type: "bar", labels: ["Q1", "Q2", "Q3", "Q4"], series: [{ name: "Revenue", values: [12, 18, 24, 31] }] };
  if (layout === "quote" && !next.quote) next.quote = s.subtitle ?? s.title;
  return next;
}

function RowList<T>({ rows, render, onChange, make }: { rows: T[]; render: (r: T, set: (r: T) => void) => React.ReactNode; onChange: (rows: T[]) => void; make: () => T }) {
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex items-start gap-1.5">
          <div className="min-w-0 flex-1">{render(r, (nr) => onChange(rows.map((x, k) => (k === i ? nr : x))))}</div>
          <button className="ghost-btn px-2! text-mute" onClick={() => onChange(rows.filter((_, k) => k !== i))} title="Remove">
            ✕
          </button>
        </div>
      ))}
      <button className="ghost-btn border-[1.5px] border-dashed border-line" onClick={() => onChange([...rows, make()])}>
        + Add
      </button>
    </div>
  );
}

function ChartEditor({ chart, onChange }: { chart: Chart; onChange: (c: Chart) => void }) {
  const pie = chart.type === "pie" || chart.type === "doughnut";
  const series = pie ? chart.series.slice(0, 1) : chart.series;
  const setCell = (si: number, li: number, v: string) =>
    onChange({ ...chart, series: chart.series.map((s, k) => (k === si ? { ...s, values: chart.labels.map((_, j) => (j === li ? Number(v) || 0 : (s.values[j] ?? 0))) } : s)) });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-paper-2 p-1">
        {(["bar", "line", "pie", "doughnut"] as const).map((t) => (
          <button key={t} onClick={() => onChange({ ...chart, type: t })} className={`rounded-lg py-1 text-xs font-medium capitalize ${chart.type === t ? "bg-card shadow-sm" : "text-mute"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border-[1.5px] border-line bg-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-line">
              <th className="p-1.5 text-left font-medium text-mute">Label</th>
              {series.map((s, si) => (
                <th key={si} className="p-1">
                  <input className="w-full rounded bg-transparent px-1 font-medium outline-none focus:bg-paper" value={s.name} onChange={(e) => onChange({ ...chart, series: chart.series.map((x, k) => (k === si ? { ...x, name: e.target.value } : x)) })} />
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {chart.labels.map((l, li) => (
              <tr key={li} className="border-b border-line/60 last:border-0">
                <td className="p-1">
                  <input className="w-full rounded bg-transparent px-1 outline-none focus:bg-paper" value={l} onChange={(e) => onChange({ ...chart, labels: chart.labels.map((x, k) => (k === li ? e.target.value : x)) })} />
                </td>
                {series.map((s, si) => (
                  <td key={si} className="p-1">
                    <input type="number" className="w-full rounded bg-transparent px-1 text-right outline-none focus:bg-paper" value={s.values[li] ?? 0} onChange={(e) => setCell(si, li, e.target.value)} />
                  </td>
                ))}
                <td className="pr-1">
                  <button className="text-mute hover:text-ink" onClick={() => onChange({ ...chart, labels: chart.labels.filter((_, k) => k !== li), series: chart.series.map((s) => ({ ...s, values: s.values.filter((_, k) => k !== li) })) })}>
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button className="ghost-btn border-[1.5px] border-dashed border-line" onClick={() => onChange({ ...chart, labels: [...chart.labels, `Item ${chart.labels.length + 1}`], series: chart.series.map((s) => ({ ...s, values: [...s.values, 0] })) })}>
          + Row
        </button>
        {!pie && chart.series.length < 4 && (
          <button className="ghost-btn border-[1.5px] border-dashed border-line" onClick={() => onChange({ ...chart, series: [...chart.series, { name: `Series ${chart.series.length + 1}`, values: chart.labels.map(() => 0) }] })}>
            + Series
          </button>
        )}
        {!pie && chart.series.length > 1 && (
          <button className="ghost-btn" onClick={() => onChange({ ...chart, series: chart.series.slice(0, -1) })}>
            − Series
          </button>
        )}
        <input className="field w-20! py-1! text-xs" placeholder="Unit" value={chart.unit ?? ""} onChange={(e) => onChange({ ...chart, unit: e.target.value || undefined })} />
      </div>
    </div>
  );
}

export function SlideEditor({ slide, onChange }: { slide: Slide; onChange: (s: Slide) => void }) {
  const set = (patch: Partial<Slide>) => onChange({ ...slide, ...patch });
  const l = slide.layout;
  const imgRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <Field label="Layout">
        <div className="grid grid-cols-3 gap-1">
          {LAYOUTS.map((x) => (
            <button
              key={x}
              onClick={() => x !== l && onChange(withLayout(slide, x))}
              className={`rounded-lg border-[1.5px] px-1.5 py-1.5 text-[11px] font-medium leading-tight transition ${x === l ? "border-ink bg-ink text-paper" : "border-line bg-card hover:border-ink"}`}
            >
              {LAYOUT_LABELS[x]}
            </button>
          ))}
        </div>
      </Field>

      {l !== "quote" && (
        <Field label="Title">
          <textarea className="field resize-none" rows={2} value={slide.title} onChange={(e) => set({ title: e.target.value })} />
        </Field>
      )}

      {["title", "section", "closing", "bullets", "stats", "chart", "imageText"].includes(l) && (
        <Field label="Subtitle">
          <input className="field" value={slide.subtitle ?? ""} onChange={(e) => set({ subtitle: e.target.value || undefined })} />
        </Field>
      )}

      {l === "imageText" && (
        <Field label="Image">
          <div className="flex items-center gap-2">
            <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded-lg border-[1.5px] border-dashed border-line bg-card text-2xl">
              {slide.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={slide.image.src} alt="" className="h-full w-full object-cover" />
              ) : (
                slide.icon || "🖼️"
              )}
            </div>
            <div className="flex flex-col gap-1">
              <button className="ink-btn sm" onClick={() => imgRef.current?.click()}>
                {slide.image ? "Replace" : "Upload image"}
              </button>
              {slide.image && (
                <button className="ghost-btn py-0.5! text-xs" onClick={() => set({ image: undefined })}>
                  Remove
                </button>
              )}
            </div>
            <input
              ref={imgRef}
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) set({ image: await loadImage(f) });
              }}
            />
          </div>
          {!slide.image && (
            <div className="mt-2 flex flex-wrap gap-1">
              {ICONS.map((ic) => (
                <button key={ic} onClick={() => set({ icon: ic })} className={`rounded-md px-1 text-lg ${slide.icon === ic ? "bg-ember-soft" : "hover:bg-paper-2"}`}>
                  {ic}
                </button>
              ))}
            </div>
          )}
        </Field>
      )}

      {(l === "bullets" || l === "imageText" || l === "chart") && (
        <Field label={l === "chart" ? "Takeaways" : "Bullets"} hint="one per line">
          <textarea className="field" rows={5} value={join(slide.bullets)} onChange={(e) => set({ bullets: lines(e.target.value) })} />
        </Field>
      )}

      {l === "chart" && slide.chart && (
        <Field label="Chart data">
          <ChartEditor chart={slide.chart} onChange={(chart) => set({ chart })} />
        </Field>
      )}

      {l === "twoColumn" &&
        (["left", "right"] as const).map((side) => {
          const col = slide[side] ?? { heading: "", bullets: [] };
          return (
            <div key={side} className="space-y-2 rounded-xl border-[1.5px] border-line p-3">
              <Field label={`${side} column`}>
                <input className="field font-semibold" value={col.heading} onChange={(e) => set({ [side]: { ...col, heading: e.target.value } })} />
              </Field>
              <textarea className="field" rows={4} value={join(col.bullets)} onChange={(e) => set({ [side]: { ...col, bullets: lines(e.target.value) } })} />
            </div>
          );
        })}

      {(l === "cards" || l === "timeline") && (
        <Field label={l === "cards" ? "Cards" : "Steps"}>
          <RowList
            rows={slide.items ?? []}
            onChange={(items) => set({ items })}
            make={() => ({ heading: "New item", text: "Describe it briefly", icon: ICONS[(slide.items?.length ?? 0) % ICONS.length] })}
            render={(it, upd) => (
              <div className="space-y-1 rounded-xl border-[1.5px] border-line bg-card p-2">
                <div className="flex gap-1">
                  <input className="w-9 rounded-lg bg-paper-2 text-center text-base outline-none" value={it.icon ?? ""} onChange={(e) => upd({ ...it, icon: e.target.value || undefined })} />
                  <input className="min-w-0 flex-1 rounded-lg px-1.5 text-sm font-semibold outline-none focus:bg-paper" value={it.heading} onChange={(e) => upd({ ...it, heading: e.target.value })} />
                </div>
                <textarea className="w-full resize-none rounded-lg px-1.5 text-xs text-ink-2 outline-none focus:bg-paper" rows={2} value={it.text} onChange={(e) => upd({ ...it, text: e.target.value })} />
              </div>
            )}
          />
        </Field>
      )}

      {l === "stats" && (
        <Field label="Numbers">
          <RowList
            rows={slide.stats ?? []}
            onChange={(stats) => set({ stats })}
            make={() => ({ value: "0", label: "New metric" })}
            render={(st, upd) => (
              <div className="flex gap-1">
                <input className="field w-24! font-semibold" value={st.value} onChange={(e) => upd({ ...st, value: e.target.value })} />
                <input className="field" value={st.label} onChange={(e) => upd({ ...st, label: e.target.value })} />
              </div>
            )}
          />
        </Field>
      )}

      {l === "quote" && (
        <>
          <Field label="Quote">
            <textarea className="field" rows={4} value={slide.quote ?? ""} onChange={(e) => set({ quote: e.target.value })} />
          </Field>
          <Field label="Author">
            <input className="field" value={slide.author ?? ""} onChange={(e) => set({ author: e.target.value })} />
          </Field>
        </>
      )}
    </div>
  );
}
