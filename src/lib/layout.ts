import type { Chart, Slide } from "./schema";
import type { FontKey, ThemedTemplate as Template } from "./templates";
import { artDataUrl } from "./art";

/**
 * Every slide is laid out once as a list of absolutely-positioned elements in a
 * 960 x 540 pt canvas (16:9). The HTML preview and the PPTX exporter both draw
 * from this list, so what you see is what you download.
 */
export const W = 960;
export const H = 540;

type Box = { x: number; y: number; w: number; h: number };

export type ShapeEl = Box & {
  kind: "rect" | "ellipse";
  fill?: string;
  /** 0 (opaque) .. 1 (invisible) */
  transparency?: number;
  line?: string;
  lineWidth?: number;
  radius?: number;
  rotate?: number;
  /** Soft 3D drop shadow. */
  shadow?: boolean;
};

export type TextEl = Box & {
  kind: "text";
  text: string;
  size: number;
  color: string;
  font: FontKey;
  bold?: boolean;
  italic?: boolean;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
  /** Hex color of a 3D text shadow. */
  shadow?: string;
};

export type BulletsEl = Box & {
  kind: "bullets";
  items: string[];
  size: number;
  color: string;
  bulletColor: string;
  font: FontKey;
};

export type ImageEl = Box & {
  kind: "image";
  src: string;
  /** Natural image size, used to crop "cover" style. */
  imgW: number;
  imgH: number;
  /** Center-crop to fill the box (true) or fit inside it (false). */
  cover: boolean;
};

export type ChartEl = Box & {
  kind: "chart";
  chart: Chart;
  colors: string[];
  text: string;
  muted: string;
  grid: string;
  font: FontKey;
};

export type El = ShapeEl | TextEl | BulletsEl | ImageEl | ChartEl;

/** Blend two hex colors; t=0 gives a, t=1 gives b. */
export function mix(a: string, b: string, t: number) {
  const pa = parseInt(a, 16),
    pb = parseInt(b, 16);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
  return ((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0").toUpperCase();
}

export function chartPalette(t: Template) {
  return [t.accent, t.accent2, mix(t.accent, t.bg, 0.45), mix(t.accent2, t.bg, 0.45), mix(t.accent, t.accent2, 0.5), t.muted, t.text];
}

export type SlideRender = { bg: string; els: El[] };

const HERO = new Set(["title", "section", "closing"]);

type Ctx = {
  t: Template;
  hero: boolean;
  bg: string;
  text: string;
  muted: string;
  accent: string;
  /** Area available for content after decorations. */
  area: Box;
};

function decorations(c: Ctx): El[] {
  const { t, hero } = c;
  const a = c.accent;
  const a2 = t.accent2;
  switch (t.deco) {
    case "none":
      return [];
    case "bar":
      return [{ kind: "rect", x: 0, y: 0, w: 14, h: H, fill: hero ? a2 : a }];
    case "topband":
      return [
        { kind: "rect", x: 0, y: 0, w: W, h: 12, fill: hero ? a2 : a },
        { kind: "rect", x: 0, y: 12, w: W, h: 3, fill: hero ? c.text : a2 },
      ];
    case "corner":
      return [
        { kind: "ellipse", x: W - 230, y: -150, w: 380, h: 380, fill: hero ? c.text : a, transparency: 0.85 },
        { kind: "ellipse", x: W - 110, y: H - 90, w: 160, h: 160, fill: a2, transparency: 0.6 },
      ];
    case "frame":
      return [{ kind: "rect", x: 20, y: 20, w: W - 40, h: H - 40, line: hero ? c.text : a, lineWidth: 1.5 }];
    case "split":
      return hero
        ? [
            { kind: "rect", x: 0, y: 0, w: W * 0.38, h: H, fill: a },
            { kind: "rect", x: W * 0.38, y: 0, w: 8, h: H, fill: a2 },
          ]
        : [{ kind: "rect", x: W - 24, y: 0, w: 24, h: H, fill: a }];
    case "blobs":
      return [
        { kind: "ellipse", x: -120, y: H - 200, w: 320, h: 320, fill: a, transparency: hero ? 0.7 : 0.85 },
        { kind: "ellipse", x: W - 200, y: -120, w: 300, h: 300, fill: a2, transparency: hero ? 0.6 : 0.8 },
        { kind: "ellipse", x: W - 90, y: 150, w: 70, h: 70, fill: hero ? c.text : a, transparency: 0.75 },
      ];
    case "diagonal":
      return [
        { kind: "rect", x: W - 260, y: H - 120, w: 520, h: 260, fill: hero ? a2 : a, rotate: -18 },
        { kind: "rect", x: W - 200, y: H - 40, w: 520, h: 30, fill: hero ? c.text : a2, rotate: -18, transparency: 0.3 },
      ];
    case "minimal":
      return [{ kind: "rect", x: 60, y: H - 44, w: W - 120, h: 1, fill: c.muted }];
    case "dots": {
      const els: El[] = [];
      for (let r = 0; r < 4; r++)
        for (let k = 0; k < 6; k++)
          els.push({ kind: "ellipse", x: W - 190 + k * 24, y: 30 + r * 24, w: 9, h: 9, fill: hero ? c.text : a2, transparency: 0.35 });
      els.push({ kind: "rect", x: 0, y: H - 14, w: W, h: 14, fill: hero ? a2 : a });
      return els;
    }
    case "stripes":
      return [
        { kind: "rect", x: 0, y: H - 30, w: W, h: 10, fill: hero ? c.text : a },
        { kind: "rect", x: 0, y: H - 20, w: W, h: 10, fill: a2 },
        { kind: "rect", x: 0, y: H - 10, w: W, h: 10, fill: c.muted },
      ];
  }
}

function contentArea(t: Template, hero: boolean): Box {
  let x = 64,
    y = 46,
    r = 64,
    b = 52;
  if (t.deco === "bar") x = 70;
  if (t.deco === "frame") {
    x = r = 72;
    y = 56;
    b = 60;
  }
  if (t.deco === "split") {
    if (hero) x = W * 0.38 + 56;
    else r = 70;
  }
  if (t.deco === "stripes" || t.deco === "dots") b = 60;
  if (t.deco === "topband") y = 56;
  return { x, y, w: W - x - r, h: H - y - b };
}

/** Pick a font size that shrinks as text grows. */
function fit(text: string, base: number, perChars: number, min: number) {
  const over = Math.max(0, text.length - perChars);
  return Math.max(min, Math.round(base - over / (perChars / 6)));
}

function heading(c: Ctx, text: string, width?: number, x?: number): TextEl[] {
  const { area, t } = c;
  return [
    {
      kind: "text",
      x: x ?? area.x,
      y: area.y,
      w: width ?? area.w - (t.deco === "dots" ? 170 : t.deco === "corner" || t.art ? 150 : 0),
      h: 62,
      text,
      size: fit(text, 32, 34, 22),
      color: c.text,
      font: t.heading,
      bold: true,
      valign: "middle",
      shadow: titleShadow(c),
    },
  ];
}

function headingUnderline(c: Ctx, x?: number): ShapeEl {
  return { kind: "rect", x: x ?? c.area.x, y: c.area.y + 68, w: 56, h: 4, fill: c.accent };
}

/** Card styling: frosted glass over artwork, soft 3D shadow when the theme has depth. */
function card(t: Template): Partial<ShapeEl> {
  const glass = t.glass ?? 0;
  return { transparency: glass, line: glass >= 0.5 ? mix(t.text, t.bg, 0.72) : undefined, lineWidth: 0.75, shadow: t.depth && glass < 0.5 };
}

function titleShadow(c: Ctx) {
  if (!c.t.depth) return undefined;
  const lum = parseInt(c.bg.slice(0, 2), 16) * 0.299 + parseInt(c.bg.slice(2, 4), 16) * 0.587 + parseInt(c.bg.slice(4, 6), 16) * 0.114;
  return lum < 128 ? "000000" : mix(c.t.accent, "000000", 0.3);
}

function bodyBox(c: Ctx): Box {
  const top = c.area.y + 92;
  return { x: c.area.x, y: top, w: c.area.w, h: c.area.y + c.area.h - top };
}

function layoutHero(c: Ctx, s: Slide): El[] {
  const { area, t } = c;
  const els: El[] = [];
  const center = !t.art && (s.layout === "closing" || ((s.layout === "section" || (s.variant ?? 0) % 2 === 1) && t.deco !== "split"));
  const textW = t.art ? area.w * 0.56 : area.w;
  const align = center ? "center" : "left";
  const titleSize = s.layout === "title" ? fit(s.title, 58, 26, 32) : fit(s.title, 52, 24, 30);
  const midY = area.y + area.h / 2;
  const titleH = midY - area.y + 6;

  els.push({
    kind: "text",
    x: area.x,
    y: midY - titleH + 22,
    w: textW,
    h: titleH,
    text: s.title,
    size: titleSize,
    color: c.text,
    font: t.heading,
    bold: true,
    align,
    valign: "bottom",
    shadow: titleShadow(c),
  });
  els.push({
    kind: "rect",
    x: center ? area.x + area.w / 2 - 40 : area.x,
    y: midY + 34,
    w: 80,
    h: 5,
    fill: t.heroAccent || t.deco === "split" ? (t.deco === "split" ? t.accent : c.text) : t.accent2,
  });
  if (s.subtitle) {
    els.push({
      kind: "text",
      x: area.x,
      y: midY + 54,
      w: textW,
      h: 90,
      text: s.subtitle,
      size: fit(s.subtitle, 24, 60, 16),
      color: c.muted,
      font: t.body,
      align,
      valign: "top",
    });
  }
  return els;
}

function bulletSize(items: string[], base: number) {
  const total = items.join(" ").length;
  if (items.length > 5 || total > 360) return base - 4;
  if (items.length > 4 || total > 260) return base - 2;
  return base;
}

function layoutBody(c: Ctx, s: Slide): El[] {
  const { t } = c;
  const els: El[] = [...heading(c, s.title), headingUnderline(c)];
  const b = bodyBox(c);

  switch (s.layout) {
    case "bullets": {
      const items = s.bullets ?? [];
      let y = b.y;
      if (s.subtitle) {
        els.push({ kind: "text", x: b.x, y, w: b.w, h: 30, text: s.subtitle, size: 19, color: c.muted, font: t.body, italic: true });
        y += 44;
      }
      if ((s.variant ?? 0) % 2 === 1) {
        // Numbered rows variant.
        const n = Math.max(items.length, 1);
        const rowH = Math.min(78, (b.y + b.h - y) / n);
        const size = Math.min(22, rowH * 0.36);
        items.forEach((it, i) => {
          const ry = y + i * rowH;
          els.push({ kind: "text", x: b.x, y: ry, w: 64, h: rowH, text: String(i + 1).padStart(2, "0"), size: Math.min(34, rowH * 0.5), color: i % 2 ? t.accent2 : c.accent, font: t.heading, bold: true, valign: "middle" });
          els.push({ kind: "text", x: b.x + 76, y: ry, w: b.w - 90, h: rowH, text: it, size, color: c.text, font: t.body, valign: "middle" });
          if (i < n - 1) els.push({ kind: "rect", x: b.x + 76, y: ry + rowH - 1, w: b.w - 90, h: 1, fill: c.muted, transparency: 0.7 });
        });
      } else {
        els.push({ kind: "bullets", x: b.x, y, w: b.w * 0.9, h: b.y + b.h - y, items, size: bulletSize(items, 26), color: c.text, bulletColor: c.accent, font: t.body });
      }
      break;
    }
    case "twoColumn": {
      const gap = 28;
      const colW = (b.w - gap) / 2;
      const colSize = (col?: { bullets: string[] }) => bulletSize(col?.bullets ?? [], 20);
      const colH = Math.min(
        b.h,
        Math.max(
          200,
          ...[s.left, s.right].map((col) =>
            (col?.bullets ?? []).reduce((h, it) => h + linesFor(it, colSize(col), colW - 70, t.body) * colSize(col) * 1.22 + colSize(col) * 0.7, 100),
          ),
        ),
      );
      [s.left, s.right].forEach((col, i) => {
        if (!col) return;
        const x = b.x + i * (colW + gap);
        els.push({ kind: "rect", x, y: b.y, w: colW, h: colH, fill: t.surface, radius: 10, ...card(t) });
        els.push({ kind: "rect", x, y: b.y, w: colW, h: 6, fill: i === 0 ? c.accent : t.accent2 });
        els.push({ kind: "text", x: x + 22, y: b.y + 20, w: colW - 44, h: 36, text: col.heading, size: 24, color: i === 0 ? c.accent : c.text, font: t.heading, bold: true, valign: "middle" });
        els.push({ kind: "bullets", x: x + 22, y: b.y + 66, w: colW - 44, h: colH - 80, items: col.bullets, size: colSize(col), color: c.text, bulletColor: i === 0 ? c.accent : t.accent2, font: t.body });
      });
      break;
    }
    case "cards": {
      const items = (s.items ?? []).slice(0, 4);
      const n = Math.max(items.length, 1);
      const gap = 22;
      const cw = (b.w - gap * (n - 1)) / n;
      const textSize = n > 3 ? 15 : 17;
      const cardH = Math.min(b.h, Math.max(230, ...items.map((it) => 168 + linesFor(it.text, textSize, cw - 40, t.body) * textSize * 1.2)));
      if ((s.variant ?? 0) % 2 === 1) {
        // 2x2 grid with icon tiles on the left.
        const cols = n > 2 ? 2 : n;
        const rows = Math.ceil(n / cols);
        const gw = (b.w - gap * (cols - 1)) / cols;
        const gh = (b.h - gap * (rows - 1)) / rows;
        items.forEach((it, i) => {
          const x = b.x + (i % cols) * (gw + gap);
          const y = b.y + Math.floor(i / cols) * (gh + gap);
          els.push({ kind: "rect", x, y, w: gw, h: gh, fill: t.surface, radius: 10, ...card(t) });
          els.push({ kind: "rect", x: x + 18, y: y + 18, w: 52, h: 52, fill: i % 2 ? t.accent2 : c.accent, radius: 12 });
          els.push({ kind: "text", x: x + 18, y: y + 18, w: 52, h: 52, text: it.icon || String(i + 1), size: it.icon ? 24 : 20, color: t.onAccent, font: t.heading, bold: true, align: "center", valign: "middle" });
          els.push({ kind: "text", x: x + 86, y: y + 16, w: gw - 104, h: 34, text: it.heading, size: 20, color: c.text, font: t.heading, bold: true, valign: "middle" });
          els.push({ kind: "text", x: x + 86, y: y + 54, w: gw - 104, h: gh - 66, text: it.text, size: 15, color: c.muted, font: t.body, valign: "top" });
        });
        break;
      }
      items.forEach((it, i) => {
        const x = b.x + i * (cw + gap);
        els.push({ kind: "rect", x, y: b.y, w: cw, h: cardH, fill: t.surface, radius: 10, ...card(t) });
        els.push({ kind: "ellipse", x: x + 20, y: b.y + 22, w: 44, h: 44, fill: i % 2 ? t.accent2 : c.accent });
        els.push({ kind: "text", x: x + 20, y: b.y + 22, w: 44, h: 44, text: it.icon || String(i + 1), size: it.icon ? 22 : 18, color: t.onAccent, font: t.heading, bold: true, align: "center", valign: "middle" });
        els.push({ kind: "text", x: x + 20, y: b.y + 78, w: cw - 40, h: 56, text: it.heading, size: n > 3 ? 20 : 23, color: c.text, font: t.heading, bold: true, valign: "top" });
        els.push({ kind: "text", x: x + 20, y: b.y + 138, w: cw - 40, h: cardH - 150, text: it.text, size: textSize, color: c.muted, font: t.body, valign: "top" });
      });
      break;
    }
    case "stats": {
      const stats = (s.stats ?? []).slice(0, 4);
      const n = Math.max(stats.length, 1);
      const cw = b.w / n;
      const y = b.y + Math.max(20, (b.h - 200) / 2 - 10);
      if ((s.variant ?? 0) % 2 === 1) {
        const gap = 20;
        const sw = (b.w - gap * (n - 1)) / n;
        const sh = Math.min(b.h - 50, 230);
        stats.forEach((st, i) => {
          const x = b.x + i * (sw + gap);
          els.push({ kind: "rect", x, y: b.y + 10, w: sw, h: sh, fill: i % 2 ? t.accent2 : c.accent, radius: 14, shadow: t.depth });
          els.push({ kind: "text", x: x + 22, y: b.y + 30, w: sw - 44, h: 100, text: st.value, size: fit(st.value, n > 3 ? 50 : 60, 5, 28), color: t.onAccent, font: t.heading, bold: true, valign: "middle" });
          els.push({ kind: "text", x: x + 22, y: b.y + 140, w: sw - 44, h: sh - 140, text: st.label, size: 18, color: t.onAccent, font: t.body, valign: "top" });
        });
        if (s.subtitle) els.push({ kind: "text", x: b.x, y: b.y + b.h - 34, w: b.w, h: 30, text: s.subtitle, size: 15, color: c.muted, font: t.body, italic: true });
        break;
      }
      stats.forEach((st, i) => {
        const x = b.x + i * cw;
        if (i > 0) els.push({ kind: "rect", x, y: y + 10, w: 1.5, h: 160, fill: c.muted, transparency: 0.6 });
        els.push({ kind: "text", x: x + 10, y, w: cw - 20, h: 100, text: st.value, size: fit(st.value, n > 3 ? 56 : 68, 5, 32), color: c.accent, font: t.heading, bold: true, align: "center", valign: "middle" });
        els.push({ kind: "text", x: x + 16, y: y + 108, w: cw - 32, h: 80, text: st.label, size: 19, color: c.muted, font: t.body, align: "center", valign: "top" });
      });
      if (s.subtitle)
        els.push({ kind: "text", x: b.x, y: b.y + b.h - 40, w: b.w, h: 34, text: s.subtitle, size: 15, color: c.muted, font: t.body, italic: true, align: "center" });
      break;
    }
    case "timeline": {
      const items = (s.items ?? []).slice(0, 5);
      const n = Math.max(items.length, 1);
      const cw = b.w / n;
      if ((s.variant ?? 0) % 2 === 1) {
        // Vertical timeline.
        const rowH = b.h / n;
        els.push({ kind: "rect", x: b.x + 19, y: b.y + rowH / 2, w: 3, h: b.h - rowH, fill: c.muted, transparency: 0.5 });
        items.forEach((it, i) => {
          const y = b.y + i * rowH;
          els.push({ kind: "ellipse", x: b.x, y: y + rowH / 2 - 20, w: 40, h: 40, fill: i % 2 ? t.accent2 : c.accent });
          els.push({ kind: "text", x: b.x, y: y + rowH / 2 - 20, w: 40, h: 40, text: it.icon || String(i + 1), size: it.icon ? 18 : 16, color: t.onAccent, font: t.heading, bold: true, align: "center", valign: "middle" });
          els.push({ kind: "text", x: b.x + 60, y, w: 260, h: rowH, text: it.heading, size: 20, color: c.text, font: t.heading, bold: true, valign: "middle" });
          els.push({ kind: "text", x: b.x + 330, y, w: b.w - 330, h: rowH, text: it.text, size: 16, color: c.muted, font: t.body, valign: "middle" });
        });
        break;
      }
      const lineY = b.y + 50;
      els.push({ kind: "rect", x: b.x + cw / 2, y: lineY - 2, w: b.w - cw, h: 4, fill: c.muted, transparency: 0.5 });
      items.forEach((it, i) => {
        const cx = b.x + i * cw + cw / 2;
        els.push({ kind: "ellipse", x: cx - 22, y: lineY - 22, w: 44, h: 44, fill: i % 2 ? t.accent2 : c.accent });
        els.push({ kind: "text", x: cx - 22, y: lineY - 22, w: 44, h: 44, text: String(i + 1), size: 17, color: t.onAccent, font: t.heading, bold: true, align: "center", valign: "middle" });
        els.push({ kind: "text", x: cx - cw / 2 + 8, y: lineY + 40, w: cw - 16, h: 52, text: it.heading, size: n > 4 ? 19 : 22, color: c.text, font: t.heading, bold: true, align: "center", valign: "top" });
        els.push({ kind: "text", x: cx - cw / 2 + 8, y: lineY + 96, w: cw - 16, h: b.h - 150, text: it.text, size: n > 4 ? 15 : 17, color: c.muted, font: t.body, align: "center", valign: "top" });
      });
      break;
    }
    case "chart": {
      if (!s.chart) break;
      const side = (s.variant ?? 0) % 2 === 1 && (s.bullets?.length || s.subtitle);
      let top = b.y;
      if (s.subtitle && !side) {
        els.push({ kind: "text", x: b.x, y: top, w: b.w, h: 28, text: s.subtitle, size: 17, color: c.muted, font: t.body, italic: true });
        top += 36;
      }
      const chartW = side ? b.w * 0.6 : b.w;
      els.push({ kind: "chart", x: b.x, y: top, w: chartW, h: b.y + b.h - top, chart: s.chart, colors: chartPalette(t), text: c.text, muted: c.muted, grid: mix(t.muted, t.bg, 0.6), font: t.body });
      if (side) {
        const x = b.x + chartW + 30;
        els.push({ kind: "rect", x, y: b.y, w: b.w - chartW - 30, h: b.h, fill: t.surface, radius: 10, ...card(t) });
        els.push({ kind: "text", x: x + 20, y: b.y + 16, w: b.w - chartW - 70, h: 30, text: "Key takeaways", size: 18, color: c.accent, font: t.heading, bold: true });
        els.push({ kind: "bullets", x: x + 20, y: b.y + 56, w: b.w - chartW - 70, h: b.h - 70, items: s.bullets?.length ? s.bullets : [s.subtitle ?? ""], size: 16, color: c.text, bulletColor: c.accent, font: t.body });
      }
      break;
    }
    case "imageText": {
      // Full-bleed image on one side, content on the other.
      els.length = 0;
      const flip = (s.variant ?? 0) % 2 === 1;
      const imgW = W * 0.44;
      const imgX = flip ? 0 : W - imgW;
      if (s.image) {
        els.push({ kind: "image", x: imgX, y: 0, w: imgW, h: H, src: s.image.src, imgW: s.image.w, imgH: s.image.h, cover: true });
      } else {
        els.push({ kind: "rect", x: imgX, y: 0, w: imgW, h: H, fill: c.accent });
        els.push({ kind: "ellipse", x: imgX + imgW * 0.5 - 150, y: H / 2 - 150, w: 300, h: 300, fill: t.accent2, transparency: 0.5 });
        els.push({ kind: "ellipse", x: imgX + imgW - 120, y: -60, w: 200, h: 200, fill: t.onAccent, transparency: 0.85 });
        els.push({ kind: "text", x: imgX, y: H / 2 - 80, w: imgW, h: 160, text: s.icon || "✦", size: 110, color: t.onAccent, font: t.heading, align: "center", valign: "middle" });
      }
      const tx = flip ? imgW + 56 : 64;
      const tw = W - imgW - 120;
      els.push(...heading(c, s.title, tw, tx), headingUnderline(c, tx));
      let y = b.y;
      if (s.subtitle) {
        els.push({ kind: "text", x: tx, y, w: tw, h: 30, text: s.subtitle, size: 18, color: c.muted, font: t.body, italic: true });
        y += 42;
      }
      els.push({ kind: "bullets", x: tx, y, w: tw, h: b.y + b.h - y, items: s.bullets ?? [], size: bulletSize(s.bullets ?? [], 22), color: c.text, bulletColor: c.accent, font: t.body });
      break;
    }
    case "quote": {
      // Quote slides replace the heading block with a large centered quote.
      els.length = 0;
      const { area } = c;
      const q = s.quote ?? s.title;
      els.push({ kind: "text", x: area.x, y: area.y + 10, w: area.w, h: 110, text: "“", size: 120, color: c.accent, font: "Georgia", bold: true, align: "center", valign: "top" });
      els.push({ kind: "text", x: area.x + 60, y: area.y + 120, w: area.w - 120, h: 210, text: q, size: fit(q, 34, 90, 22), color: c.text, font: t.heading, italic: true, align: "center", valign: "middle" });
      if (s.author)
        els.push({ kind: "text", x: area.x, y: area.y + 345, w: area.w, h: 36, text: "— " + s.author, size: 20, color: c.muted, font: t.body, align: "center" });
      break;
    }
  }
  return els;
}

/** Average glyph width as a fraction of font size, per font. */
const CHAR_W: Partial<Record<FontKey, number>> = {
  "Arial Black": 0.68,
  Verdana: 0.62,
  Tahoma: 0.55,
  Impact: 0.48,
  "Courier New": 0.6,
  "Century Gothic": 0.6,
  Garamond: 0.48,
  "Times New Roman": 0.48,
};

function linesFor(text: string, size: number, width: number, font: FontKey, bold?: boolean) {
  const cw = size * (CHAR_W[font] ?? 0.54) * (bold ? 1.06 : 1);
  const perLine = Math.max(1, Math.floor(width / cw));
  return text.split("\n").reduce((n, para) => {
    // Greedy word wrap.
    let lines = 1,
      cur = 0;
    for (const word of para.split(/\s+/)) {
      const len = word.length;
      if (cur && cur + 1 + len > perLine) {
        lines += Math.ceil(len / perLine);
        cur = len % perLine;
      } else cur += (cur ? 1 : 0) + len;
    }
    return n + lines;
  }, 0);
}

/** Shrink text so its estimated wrapped height fits inside its box. */
function shrinkToFit(el: El): El {
  if (el.kind === "text") {
    let size = el.size;
    while (size > 9 && linesFor(el.text, size, el.w, el.font, el.bold) * size * 1.2 > el.h) size -= 1;
    return { ...el, size };
  }
  if (el.kind === "bullets") {
    let size = el.size;
    const height = (sz: number) =>
      el.items.reduce((h, it) => h + linesFor(it, sz, el.w - sz * 1.6, el.font) * sz * 1.22 + sz * 0.7, 0);
    while (size > 10 && height(size) > el.h) size -= 1;
    return { ...el, size };
  }
  return el;
}

export function layoutSlide(s: Slide, t: Template, index: number, total: number): SlideRender {
  const hero = HERO.has(s.layout);
  const onAccentBg = hero && t.heroAccent && t.deco !== "split" && !t.art;
  const c: Ctx = {
    t,
    hero,
    bg: onAccentBg ? t.accent : t.bg,
    text: onAccentBg ? t.onAccent : t.text,
    muted: onAccentBg ? t.onAccent : t.muted,
    accent: onAccentBg ? t.onAccent : t.accent,
    area: contentArea(t, hero),
  };
  const els: El[] = [];
  if (t.art) {
    const lum = parseInt(c.bg.slice(0, 2), 16) * 0.299 + parseInt(c.bg.slice(2, 4), 16) * 0.587 + parseInt(c.bg.slice(4, 6), 16) * 0.114;
    const src = artDataUrl(t.art, { bg: c.bg, a: t.accent, b: t.accent2, text: t.text, dark: lum < 128 }, hero, index % 3);
    els.push({ kind: "image", x: 0, y: 0, w: W, h: H, src, imgW: W, imgH: H, cover: true });
  }
  els.push(...decorations(c));
  els.push(...(hero ? layoutHero(c, s) : layoutBody(c, s)));
  if (!hero && s.layout !== "imageText") {
    const lowFooter = t.deco === "stripes" || t.deco === "dots";
    els.push({ kind: "text", x: W - 140, y: lowFooter ? H - 58 : H - 40, w: 60, h: 20, text: `${index + 1} / ${total}`, size: 11, color: t.muted, font: t.body, align: "right", valign: "middle" });
  }
  if (t.logo) {
    const lh = 28;
    const lw = Math.min(140, (lh * t.logo.w) / t.logo.h);
    const lowFooter = t.deco === "stripes" || t.deco === "dots" || t.deco === "minimal";
    const lx = s.layout === "imageText" && (s.variant ?? 0) % 2 === 0 ? 64 : s.layout === "imageText" ? W * 0.44 + 56 : c.area.x;
    els.push({ kind: "image", x: lx, y: lowFooter ? H - 74 : H - 46, w: lw, h: lh, src: t.logo.src, imgW: t.logo.w, imgH: t.logo.h, cover: false });
  }
  return { bg: c.bg, els: els.map(shrinkToFit) };
}
