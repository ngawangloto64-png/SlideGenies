"use client";

import { useRef, useState } from "react";
import { FONT_STACKS, type Brand, type FontKey } from "@/lib/templates";
import { loadImage } from "@/lib/client";
import { ART_CHOICES, ART_LABELS, artDataUrl } from "@/lib/art";

const FONTS = Object.keys(FONT_STACKS) as FontKey[];
const SWATCHES = ["FF5A1F", "2F4BFF", "0F766E", "7C3AED", "E11D48", "111827", "D4A017", "16A34A", "0EA5E9", "F472B6"];

function ColorField({ label, value, onChange }: { label: string; value?: string; onChange: (v?: string) => void }) {
  return (
    <div>
      <span className="label mb-1.5 block">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {SWATCHES.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`h-6 w-6 rounded-full border-[1.5px] ${value === c ? "border-ink ring-2 ring-ink ring-offset-1" : "border-ink/20"}`}
            style={{ background: `#${c}` }}
            aria-label={`#${c}`}
          />
        ))}
        <label className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border-[1.5px] border-dashed border-ink/40" title="Custom color">
          <input type="color" className="absolute inset-0 cursor-pointer opacity-0" value={`#${value ?? "000000"}`} onChange={(e) => onChange(e.target.value.slice(1).toUpperCase())} />
          <span className="flex h-full items-center justify-center text-xs">+</span>
        </label>
        {value && (
          <button className="ghost-btn px-2! py-0.5! text-xs" onClick={() => onChange(undefined)}>
            reset
          </button>
        )}
      </div>
    </div>
  );
}

export function BrandKit({ brand, onChange }: { brand: Brand; onChange: (b: Brand) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const set = (patch: Partial<Brand>) => onChange({ ...brand, ...patch, enabled: true });

  return (
    <div className="space-y-4">
      <div>
        <span className="label mb-1 block">Art Blend</span>
        <p className="mb-2 text-xs text-mute">Blend any PePeTi artwork into the theme you picked.</p>
        <div className="grid grid-cols-3 gap-1.5">
          {(["default", "none", ...ART_CHOICES] as const).map((k) => {
            const active = (brand.art ?? "default") === k;
            return (
              <button
                key={k}
                onClick={() => onChange({ ...brand, art: k === "default" ? undefined : k })}
                className={`overflow-hidden rounded-lg border-[1.5px] text-left transition ${active ? "border-ink shadow-[2px_2px_0_var(--color-ember)]" : "border-line hover:border-ink"}`}
                title={k === "default" ? "Theme default" : k === "none" ? "No artwork" : ART_LABELS[k]}
              >
                {k === "default" || k === "none" ? (
                  <span className="flex aspect-video items-center justify-center bg-paper-2 text-lg">{k === "default" ? "◎" : "∅"}</span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={artDataUrl(k, { bg: "0E1330", a: "7C5CFF", b: "22D3EE", text: "F2F4FF", dark: true }, true)} alt="" className="block aspect-video w-full object-cover" />
                )}
                <span className="block truncate bg-card px-1.5 py-0.5 text-[10px] font-medium">{k === "default" ? "Theme default" : k === "none" ? "None" : ART_LABELS[k]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-center justify-between rounded-xl border-[1.5px] border-line bg-card px-3 py-2.5">
        <span>
          <span className="block text-sm font-semibold">Use my Brand Vault</span>
          <span className="text-xs text-mute">Your logo, colors & fonts on every theme</span>
        </span>
        <input type="checkbox" className="h-4 w-4 accent-[var(--color-ember)]" checked={brand.enabled} onChange={(e) => onChange({ ...brand, enabled: e.target.checked })} />
      </label>

      <div>
        <span className="label mb-1.5 block">Logo</span>
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-28 items-center justify-center overflow-hidden rounded-lg border-[1.5px] border-dashed border-line bg-card">
            {brand.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo.src} alt="logo" className="max-h-10 max-w-24 object-contain" />
            ) : (
              <span className="text-xs text-mute">No logo</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <button className="ink-btn sm" onClick={() => fileRef.current?.click()}>
              Upload
            </button>
            {brand.logo && (
              <button className="ghost-btn py-0.5! text-xs" onClick={() => set({ logo: undefined })}>
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              try {
                setErr(null);
                set({ logo: await loadImage(f, 600) });
              } catch (x) {
                setErr((x as Error).message);
              }
            }}
          />
        </div>
        {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
      </div>

      <ColorField label="Primary color" value={brand.accent} onChange={(v) => set({ accent: v })} />
      <ColorField label="Secondary color" value={brand.accent2} onChange={(v) => set({ accent2: v })} />

      <div className="grid grid-cols-2 gap-2">
        {(["heading", "body"] as const).map((k) => (
          <label key={k} className="block">
            <span className="label mb-1.5 block">{k} font</span>
            <select className="field" value={brand[k] ?? ""} onChange={(e) => set({ [k]: (e.target.value || undefined) as FontKey | undefined })}>
              <option value="">Theme default</option>
              {FONTS.map((f) => (
                <option key={f} value={f} style={{ fontFamily: FONT_STACKS[f] }}>
                  {f}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}
