/**
 * Procedural SVG artwork for the "art" templates (3D, robotic, scientific, space…).
 *
 * Each style draws a full 960 x 540 background from the template colors:
 *  - hero slides (title / section / closing) get a large focal illustration on the right,
 *  - content slides get a quieter version kept to the edges so text stays readable.
 * The same SVG is shown in the app and rasterized into the PPTX on export.
 */

export const ART_STYLES = [
  "iso",
  "orbs",
  "prism",
  "lowpoly",
  "tunnel",
  "waves3d",
  "circuit",
  "hud",
  "robot",
  "neural",
  "matrix",
  "molecule",
  "dna",
  "atom",
  "cells",
  "blueprint",
  "topo",
  "space",
  "synthwave",
  "aurora",
  "globe",
  "labdata",
] as const;

export type ArtStyle = (typeof ART_STYLES)[number];

export type ArtColors = { bg: string; surface: string; text: string; muted: string; accent: string; accent2: string };

const W = 960;
const H = 540;

/* ───────────────────────── helpers ───────────────────────── */

function blend(a: string, b: string, t: number) {
  const pa = parseInt(a, 16),
    pb = parseInt(b, 16);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
  return ((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0").toUpperCase();
}
const lighten = (c: string, t: number) => blend(c, "FFFFFF", t);
const darken = (c: string, t: number) => blend(c, "000000", t);
const isDark = (c: string) => {
  const n = parseInt(c, 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 128;
};
const h = (c: string) => `#${c}`;
const f = (n: number) => +n.toFixed(1);

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Ctx = {
  c: ArtColors;
  hero: boolean;
  r: () => number;
  dark: boolean;
  /** defs collected while drawing */
  defs: string[];
  uid: () => string;
};

/** Background wash: subtle vertical gradient from the template background. */
function wash(x: Ctx, strength = 0.07) {
  const id = x.uid();
  const top = x.c.bg;
  const bottom = blend(x.c.bg, x.c.accent, strength);
  x.defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${h(top)}"/><stop offset="1" stop-color="${h(bottom)}"/></linearGradient>`);
  return `<rect width="${W}" height="${H}" fill="url(#${id})"/>`;
}

function glowFilter(x: Ctx, sd = 6) {
  const id = x.uid();
  x.defs.push(`<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`);
  return id;
}

function blurFilter(x: Ctx, sd: number) {
  const id = x.uid();
  x.defs.push(`<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd}"/></filter>`);
  return id;
}

/** Glossy 3D sphere gradient. */
function sphereGrad(x: Ctx, color: string) {
  const id = x.uid();
  x.defs.push(
    `<radialGradient id="${id}" cx="0.35" cy="0.3" r="0.75"><stop offset="0" stop-color="${h(lighten(color, 0.75))}"/><stop offset="0.35" stop-color="${h(lighten(color, 0.15))}"/><stop offset="0.8" stop-color="${h(color)}"/><stop offset="1" stop-color="${h(darken(color, 0.45))}"/></radialGradient>`,
  );
  return id;
}

function sphere(x: Ctx, cx: number, cy: number, r: number, color: string, opacity = 1) {
  const g = sphereGrad(x, color);
  return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#${g})" opacity="${opacity}"/>`;
}

function linGrad(x: Ctx, a: string, b: string, x2 = 1, y2 = 1, oa = 1, ob = 1) {
  const id = x.uid();
  x.defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${h(a)}" stop-opacity="${oa}"/><stop offset="1" stop-color="${h(b)}" stop-opacity="${ob}"/></linearGradient>`);
  return id;
}

/** Faint corner brackets (HUD frame). */
function brackets(color: string, op: number, inset = 22, len = 34) {
  const p = (d: string) => `<path d="${d}" fill="none" stroke="${h(color)}" stroke-width="2" opacity="${op}"/>`;
  return [
    p(`M${inset} ${inset + len} V${inset} H${inset + len}`),
    p(`M${W - inset - len} ${inset} H${W - inset} V${inset + len}`),
    p(`M${inset} ${H - inset - len} V${H - inset} H${inset + len}`),
    p(`M${W - inset - len} ${H - inset} H${W - inset} V${H - inset - len}`),
  ].join("");
}

/* ───────────────────────── styles ───────────────────────── */

function iso(x: Ctx) {
  const { c, hero } = x;
  const out = [wash(x, 0.1)];
  const s = hero ? 46 : 22;
  const ox = hero ? 720 : 870;
  const oy = hero ? 120 : 30;
  // Faint isometric grid lines
  const gridOp = hero ? 0.08 : 0.05;
  for (let k = -12; k < 24; k++) {
    out.push(`<line x1="${k * 60}" y1="0" x2="${k * 60 + 935}" y2="${H}" stroke="${h(c.accent)}" stroke-width="1" opacity="${gridOp}"/>`);
    out.push(`<line x1="${k * 60}" y1="${H}" x2="${k * 60 + 935}" y2="0" stroke="${h(c.accent)}" stroke-width="1" opacity="${gridOp}"/>`);
  }
  const cube = (i: number, j: number, k: number, col: string, scale = s) => {
    const px = ox + (i - j) * scale * 0.866;
    const py = oy + (i + j) * scale * 0.5 - k * scale;
    const top = `${f(px)},${f(py)} ${f(px + scale * 0.866)},${f(py + scale * 0.5)} ${f(px)},${f(py + scale)} ${f(px - scale * 0.866)},${f(py + scale * 0.5)}`;
    const left = `${f(px - scale * 0.866)},${f(py + scale * 0.5)} ${f(px)},${f(py + scale)} ${f(px)},${f(py + 2 * scale)} ${f(px - scale * 0.866)},${f(py + 1.5 * scale)}`;
    const right = `${f(px)},${f(py + scale)} ${f(px + scale * 0.866)},${f(py + scale * 0.5)} ${f(px + scale * 0.866)},${f(py + 1.5 * scale)} ${f(px)},${f(py + 2 * scale)}`;
    return `<polygon points="${top}" fill="${h(lighten(col, 0.35))}"/><polygon points="${left}" fill="${h(col)}"/><polygon points="${right}" fill="${h(darken(col, 0.3))}"/>`;
  };
  const n = hero ? 4 : 3;
  const heights: number[][] = [];
  for (let i = 0; i < n; i++) heights.push(Array.from({ length: n }, () => 1 + Math.floor(x.r() * (hero ? 4 : 3))));
  heights[0][0] = hero ? 5 : 3;
  const cells: [number, number][] = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) cells.push([i, j]);
  cells.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  // Shadow under the stack
  const blur = blurFilter(x, 16);
  out.push(`<ellipse cx="${ox}" cy="${f(oy + n * s + s * 1.4)}" rx="${f(n * s * 1.1)}" ry="${f(n * s * 0.4)}" fill="${h(darken(c.accent, 0.5))}" opacity="0.25" filter="url(#${blur})"/>`);
  for (const [i, j] of cells)
    for (let k = 0; k < heights[i][j]; k++) out.push(cube(i, j, k, (i + j + k) % 3 === 0 ? c.accent2 : c.accent));
  if (hero) {
    // Floating cubes
    out.push(`<g opacity="0.9">${cube(-3.2, 1.2, 6.4, c.accent2, 26)}</g>`);
    out.push(`<g opacity="0.8">${cube(4.6, -2.4, 5.6, c.accent, 18)}</g>`);
  }
  return out.join("");
}

function orbs(x: Ctx) {
  const { c, hero } = x;
  const out = [wash(x, 0.12)];
  const blur = blurFilter(x, 18);
  const shadow = (cx: number, cy: number, rx: number) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${f(rx * 0.22)}" fill="${h(darken(c.accent, 0.6))}" opacity="0.3" filter="url(#${blur})"/>`;
  if (hero) {
    const ring = linGrad(x, c.accent2, c.accent, 1, 0, 0.9, 0.2);
    out.push(shadow(730, 470, 170));
    out.push(`<ellipse cx="730" cy="270" rx="245" ry="62" fill="none" stroke="url(#${ring})" stroke-width="6" transform="rotate(-18 730 270)"/>`);
    out.push(sphere(x, 730, 265, 165, c.accent));
    out.push(sphere(x, 560, 105, 58, c.accent2));
    out.push(sphere(x, 900, 430, 36, lighten(c.accent2, 0.2)));
    out.push(sphere(x, 905, 120, 18, c.accent));
    out.push(`<ellipse cx="730" cy="270" rx="245" ry="62" fill="none" stroke="url(#${ring})" stroke-width="6" stroke-dasharray="0 400 600" transform="rotate(-18 730 270)"/>`);
  } else {
    out.push(sphere(x, 935, 30, 105, c.accent, 0.95));
    out.push(sphere(x, 835, 120, 26, c.accent2));
    out.push(sphere(x, 20, 545, 75, c.accent2, 0.6));
  }
  return out.join("");
}

function prism(x: Ctx) {
  const { c, hero } = x;
  const out = [wash(x, 0.12)];
  const pyramid = (cx: number, base: number, s: number, op = 1) => {
    const apex = [cx, base - s * 1.25];
    const l = [cx - s * 0.9, base];
    const m = [cx + s * 0.15, base + s * 0.28];
    const rr = [cx + s * 0.95, base - s * 0.05];
    const gL = linGrad(x, lighten(c.accent, 0.5), c.accent, 0, 1, 0.95, 0.75);
    const gR = linGrad(x, lighten(c.accent2, 0.3), darken(c.accent2, 0.35), 0, 1, 0.9, 0.7);
    const P = (pts: number[][]) => pts.map((p) => `${f(p[0])},${f(p[1])}`).join(" ");
    return `<g opacity="${op}"><polygon points="${P([apex, l, m])}" fill="url(#${gL})"/><polygon points="${P([apex, m, rr])}" fill="url(#${gR})"/><polyline points="${P([l, apex, rr])}" fill="none" stroke="${h(lighten(c.accent, 0.8))}" stroke-width="1.5" opacity="0.7"/><line x1="${f(apex[0])}" y1="${f(apex[1])}" x2="${f(m[0])}" y2="${f(m[1])}" stroke="#FFFFFF" stroke-width="1.2" opacity="0.6"/></g>`;
  };
  if (hero) {
    const glow = blurFilter(x, 40);
    out.push(`<circle cx="740" cy="300" r="190" fill="${h(c.accent)}" opacity="0.28" filter="url(#${glow})"/>`);
    out.push(pyramid(740, 400, 190));
    out.push(pyramid(560, 170, 50, 0.85));
    out.push(pyramid(905, 150, 34, 0.8));
    // Light beam
    const beam = linGrad(x, "FFFFFF", c.accent2, 1, 0, 0.8, 0);
    out.push(`<polygon points="430,300 700,250 700,262" fill="url(#${beam})" opacity="0.7"/>`);
  } else {
    out.push(pyramid(890, 120, 70, 0.9));
    out.push(pyramid(40, 560, 60, 0.4));
  }
  return out.join("");
}

function lowpoly(x: Ctx) {
  const { c, hero } = x;
  const out = [`<rect width="${W}" height="${H}" fill="${h(c.bg)}"/>`];
  const cols = hero ? 9 : 5;
  const rows = hero ? 8 : 4;
  const x0 = hero ? 470 : 760;
  const x1 = W + 20;
  const y1 = hero ? H + 20 : 210;
  const pts: number[][][] = [];
  for (let j = 0; j <= rows; j++) {
    const row: number[][] = [];
    for (let i = 0; i <= cols; i++) {
      const fx = i / cols,
        fy = j / rows;
      // Left edge recedes to make a jagged diagonal boundary
      const edge = x0 + (hero ? (1 - fy) * 120 : fy * 120);
      const px = edge + fx * (x1 - edge) + (i > 0 && i < cols ? (x.r() - 0.5) * 40 : 0);
      const py = -20 + fy * (y1 + 20) + (j > 0 && j < rows ? (x.r() - 0.5) * 36 : 0);
      row.push([px, py]);
    }
    pts.push(row);
  }
  const tri = (a: number[], b: number[], d: number[], t: number) => {
    const shade = (x.r() - 0.5) * 0.3;
    const base = blend(c.accent, c.accent2, Math.min(1, Math.max(0, t)));
    const col = shade > 0 ? lighten(base, shade) : darken(base, -shade);
    return `<polygon points="${f(a[0])},${f(a[1])} ${f(b[0])},${f(b[1])} ${f(d[0])},${f(d[1])}" fill="${h(col)}" stroke="${h(col)}" stroke-width="0.6"/>`;
  };
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const a = pts[j][i],
        b = pts[j][i + 1],
        d = pts[j + 1][i],
        e = pts[j + 1][i + 1];
      const t = (i / cols) * 0.6 + (j / rows) * 0.4;
      out.push(tri(a, b, e, t), tri(a, e, d, t + 0.08));
    }
  return out.join("");
}

function tunnel(x: Ctx) {
  const { c, hero } = x;
  const out = [wash(x, 0.06)];
  const glow = glowFilter(x, 4);
  if (hero) {
    const vx = 720,
      vy = 270;
    out.push(`<g filter="url(#${glow})">`);
    for (let k = 0; k < 14; k++) {
      const s = Math.pow(0.8, k);
      const w = 560 * s,
        hh = 380 * s;
      out.push(`<rect x="${f(vx - w / 2)}" y="${f(vy - hh / 2)}" width="${f(w)}" height="${f(hh)}" rx="${f(26 * s)}" fill="none" stroke="${h(k % 2 ? c.accent2 : c.accent)}" stroke-width="${f(Math.max(1, 3 * s))}" opacity="${f(0.95 - k * 0.055)}"/>`);
    }
    for (const [ex, ey] of [
      [440, 80],
      [1000, 80],
      [440, 460],
      [1000, 460],
    ])
      out.push(`<line x1="${vx}" y1="${vy}" x2="${ex}" y2="${ey}" stroke="${h(c.accent)}" stroke-width="1" opacity="0.35"/>`);
    out.push(`</g>`);
    out.push(`<circle cx="${vx}" cy="${vy}" r="6" fill="#FFFFFF" filter="url(#${glow})"/>`);
  } else {
    for (let k = 0; k < 4; k++) {
      const inset = 14 + k * 9;
      out.push(`<rect x="${inset}" y="${inset}" width="${W - inset * 2}" height="${H - inset * 2}" rx="${18 - k * 3}" fill="none" stroke="${h(k % 2 ? c.accent2 : c.accent)}" stroke-width="1.2" opacity="${f(0.5 - k * 0.11)}"/>`);
    }
  }
  return out.join("");
}

function waves3d(x: Ctx) {
  const { c, hero } = x;
  const out = [wash(x, 0.08)];
  const g = linGrad(x, c.accent, c.accent2, 1, 0);
  const lines = hero ? 26 : 12;
  const top = hero ? 260 : 440;
  for (let k = 0; k < lines; k++) {
    const t = k / lines;
    const y0 = top + Math.pow(t, 1.6) * (H - top + 40);
    const amp = 10 + t * (hero ? 60 : 22);
    const pts: string[] = [];
    for (let i = 0; i <= 48; i++) {
      const px = (i / 48) * (W + 40) - 20;
      const py = y0 + Math.sin(i * 0.28 + k * 0.45) * amp * Math.sin((i / 48) * Math.PI) + Math.cos(i * 0.11 - k * 0.3) * amp * 0.4;
      pts.push(`${f(px)},${f(py)}`);
    }
    out.push(`<polyline points="${pts.join(" ")}" fill="none" stroke="url(#${g})" stroke-width="${f(0.8 + t * 1.8)}" opacity="${f(0.25 + t * 0.6)}"/>`);
  }
  if (hero) {
    const blur = blurFilter(x, 50);
    out.push(`<circle cx="760" cy="150" r="110" fill="${h(c.accent2)}" opacity="0.35" filter="url(#${blur})"/>`);
  }
  return out.join("");
}

function circuit(x: Ctx) {
  const { c, hero } = x;
  const out = [wash(x, 0.08)];
  const glow = glowFilter(x, 3);
  const traces: string[] = [];
  const pad = (px: number, py: number, col: string) => `<circle cx="${f(px)}" cy="${f(py)}" r="4.5" fill="${h(c.bg)}" stroke="${h(col)}" stroke-width="2"/>`;
  const trace = (sx: number, sy: number, dx: number, dy: number, l1: number, l2: number, l3: number, col: string, op: number) => {
    // straight, 45° bend, straight
    const p1 = [sx + dx * l1, sy + dy * l1];
    const side = x.r() > 0.5 ? 1 : -1;
    const [px, py] = dx === 0 ? [side, 0] : [0, side];
    const p2 = [p1[0] + dx * l2 + px * l2, p1[1] + dy * l2 + py * l2];
    const p3 = [p2[0] + dx * l3, p2[1] + dy * l3];
    traces.push(`<polyline points="${f(sx)},${f(sy)} ${f(p1[0])},${f(p1[1])} ${f(p2[0])},${f(p2[1])} ${f(p3[0])},${f(p3[1])}" fill="none" stroke="${h(col)}" stroke-width="2" opacity="${op}"/>`);
    traces.push(`<g opacity="${op}">${pad(p3[0], p3[1], col)}</g>`);
  };
  if (hero) {
    const cx = 720,
      cy = 270,
      s = 150;
    for (let i = 0; i < 7; i++) {
      const o = -s / 2 + 15 + i * ((s - 30) / 6);
      const col = i % 3 === 0 ? c.accent2 : c.accent;
      trace(cx + s / 2, cy + o, 1, 0, 20, 30 + x.r() * 40, 30 + x.r() * 70, col, 0.9);
      trace(cx - s / 2, cy + o, -1, 0, 20, 30 + x.r() * 40, 40 + x.r() * 120, col, 0.9);
      trace(cx + o, cy - s / 2, 0, -1, 20, 20 + x.r() * 30, 20 + x.r() * 50, col, 0.9);
      trace(cx + o, cy + s / 2, 0, 1, 20, 20 + x.r() * 30, 20 + x.r() * 50, col, 0.9);
    }
    out.push(`<g filter="url(#${glow})">${traces.join("")}</g>`);
    const chip = linGrad(x, lighten(c.surface, 0.08), darken(c.surface, 0.2));
    // pins
    for (let i = 0; i < 7; i++) {
      const o = -s / 2 + 15 + i * ((s - 30) / 6);
      out.push(`<rect x="${cx + s / 2}" y="${f(cy + o - 3)}" width="12" height="6" fill="${h(c.muted)}"/><rect x="${cx - s / 2 - 12}" y="${f(cy + o - 3)}" width="12" height="6" fill="${h(c.muted)}"/><rect x="${f(cx + o - 3)}" y="${cy - s / 2 - 12}" width="6" height="12" fill="${h(c.muted)}"/><rect x="${f(cx + o - 3)}" y="${cy + s / 2}" width="6" height="12" fill="${h(c.muted)}"/>`);
    }
    out.push(`<rect x="${cx - s / 2}" y="${cy - s / 2}" width="${s}" height="${s}" rx="10" fill="url(#${chip})" stroke="${h(c.accent)}" stroke-width="2"/>`);
    out.push(`<rect x="${cx - 38}" y="${cy - 38}" width="76" height="76" rx="6" fill="none" stroke="${h(c.accent2)}" stroke-width="1.5" opacity="0.8"/>`);
    out.push(`<circle cx="${cx}" cy="${cy}" r="16" fill="${h(c.accent)}" filter="url(#${glow})"/>`);
  } else {
    for (let i = 0; i < 6; i++) trace(W + 5, 30 + i * 30, -1, 0, 30 + x.r() * 40, 20 + x.r() * 20, 20 + x.r() * 60, i % 2 ? c.accent2 : c.accent, 0.45);
    for (let i = 0; i < 4; i++) trace(-5, H - 30 - i * 26, 1, 0, 20 + x.r() * 30, 18, 20 + x.r() * 40, c.accent, 0.3);
    out.push(`<g filter="url(#${glow})">${traces.join("")}</g>`);
  }
  return out.join("");
}

function hud(x: Ctx) {
  const { c, hero } = x;
  const out = [wash(x, 0.06), brackets(c.accent, hero ? 0.8 : 0.55)];
  const glow = glowFilter(x, 4);
  const ring = (cx: number, cy: number, sc: number, op: number) => {
    const g: string[] = [];
    const arc = (r: number, a0: number, a1: number, col: string, wdt: number) => {
      const p = (a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
      const [sx, sy] = p(a0),
        [ex, ey] = p(a1);
      return `<path d="M${f(sx)} ${f(sy)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${f(ex)} ${f(ey)}" fill="none" stroke="${h(col)}" stroke-width="${wdt}" stroke-linecap="round"/>`;
    };
    g.push(`<circle cx="${cx}" cy="${cy}" r="${200 * sc}" fill="none" stroke="${h(c.accent)}" stroke-width="1" opacity="0.5"/>`);
    g.push(`<circle cx="${cx}" cy="${cy}" r="${172 * sc}" fill="none" stroke="${h(c.accent)}" stroke-width="2" stroke-dasharray="4 8" opacity="0.7"/>`);
    g.push(arc(186 * sc, -60, 40, c.accent, 6 * sc));
    g.push(arc(186 * sc, 120, 200, c.accent2, 6 * sc));
    g.push(arc(140 * sc, 200, 330, c.accent, 3));
    g.push(arc(120 * sc, 10, 150, c.accent2, 2));
    for (let i = 0; i < 72; i++) {
      const a = (i * 5 * Math.PI) / 180;
      const r1 = 208 * sc,
        r2 = (i % 6 === 0 ? 226 : 216) * sc;
      g.push(`<line x1="${f(cx + r1 * Math.cos(a))}" y1="${f(cy + r1 * Math.sin(a))}" x2="${f(cx + r2 * Math.cos(a))}" y2="${f(cy + r2 * Math.sin(a))}" stroke="${h(c.accent)}" stroke-width="1.2" opacity="0.6"/>`);
    }
    g.push(`<line x1="${cx - 250 * sc}" y1="${cy}" x2="${cx - 90 * sc}" y2="${cy}" stroke="${h(c.accent)}" opacity="0.5"/><line x1="${cx + 90 * sc}" y1="${cy}" x2="${cx + 250 * sc}" y2="${cy}" stroke="${h(c.accent)}" opacity="0.5"/>`);
    const core = sphereGrad(x, c.accent);
    g.push(`<circle cx="${cx}" cy="${cy}" r="${62 * sc}" fill="url(#${core})" opacity="0.9"/>`);
    g.push(`<circle cx="${cx}" cy="${cy}" r="${84 * sc}" fill="none" stroke="${h(c.accent2)}" stroke-width="1.5" opacity="0.8"/>`);
    return `<g opacity="${op}" filter="url(#${glow})">${g.join("")}</g>`;
  };
  if (hero) {
    out.push(ring(720, 270, 1, 1));
    // Data bars
    for (let i = 0; i < 6; i++) {
      const wv = 30 + x.r() * 70;
      out.push(`<rect x="470" y="${410 + i * 12}" width="${f(wv)}" height="5" rx="2" fill="${h(i % 2 ? c.accent2 : c.accent)}" opacity="0.6"/>`);
    }
  } else {
    out.push(ring(890, 70, 0.42, 0.55));
  }
  return out.join("");
}

function robot(x: Ctx) {
  const { c, hero } = x;
  const out = [wash(x, 0.08), brackets(c.accent, hero ? 0.6 : 0.4)];
  const glow = glowFilter(x, 6);
  // Dotted grid backdrop
  const pid = x.uid();
  x.defs.push(`<pattern id="${pid}" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="${h(c.muted)}" opacity="0.35"/></pattern>`);
  out.push(`<rect width="${W}" height="${H}" fill="url(#${pid})" opacity="${hero ? 0.8 : 0.5}"/>`);
  const head = (cx: number, cy: number, s: number) => {
    const metal = linGrad(x, lighten(c.surface, x.dark ? 0.25 : 0.1), darken(c.surface, x.dark ? 0.3 : 0.15), 0.3, 1);
    const visor = linGrad(x, darken(c.bg, x.dark ? 0.4 : 0.85), darken(c.accent, 0.6), 0, 1);
    const w = 260 * s,
      hh = 210 * s;
    const g: string[] = [];
    // antenna
    g.push(`<line x1="${cx}" y1="${cy - hh / 2}" x2="${cx}" y2="${cy - hh / 2 - 46 * s}" stroke="${h(c.muted)}" stroke-width="${6 * s}"/>`);
    g.push(`<circle cx="${cx}" cy="${cy - hh / 2 - 52 * s}" r="${12 * s}" fill="${h(c.accent2)}" filter="url(#${glow})"/>`);
    // ears
    g.push(`<rect x="${cx - w / 2 - 26 * s}" y="${cy - 40 * s}" width="${30 * s}" height="${80 * s}" rx="${10 * s}" fill="url(#${metal})" stroke="${h(c.accent)}" stroke-width="2"/>`);
    g.push(`<rect x="${cx + w / 2 - 4 * s}" y="${cy - 40 * s}" width="${30 * s}" height="${80 * s}" rx="${10 * s}" fill="url(#${metal})" stroke="${h(c.accent)}" stroke-width="2"/>`);
    // neck + shoulders
    g.push(`<rect x="${cx - 40 * s}" y="${cy + hh / 2 - 4}" width="${80 * s}" height="${34 * s}" fill="${h(darken(c.surface, 0.2))}"/>`);
    if (s >= 0.6) g.push(`<path d="M${cx - 190 * s} ${H + 10} Q${cx - 180 * s} ${cy + hh / 2 + 34 * s} ${cx} ${cy + hh / 2 + 30 * s} Q${cx + 180 * s} ${cy + hh / 2 + 34 * s} ${cx + 190 * s} ${H + 10} Z" fill="url(#${metal})" stroke="${h(c.accent)}" stroke-width="2"/>`);
    if (s >= 0.6) g.push(`<circle cx="${cx}" cy="${cy + hh / 2 + 90 * s}" r="${22 * s}" fill="none" stroke="${h(c.accent2)}" stroke-width="3" filter="url(#${glow})"/>`);
    // head
    g.push(`<rect x="${cx - w / 2}" y="${cy - hh / 2}" width="${w}" height="${hh}" rx="${48 * s}" fill="url(#${metal})" stroke="${h(c.accent)}" stroke-width="2.5"/>`);
    g.push(`<rect x="${cx - w / 2 + 26 * s}" y="${cy - hh / 2 + 40 * s}" width="${w - 52 * s}" height="${hh * 0.5}" rx="${30 * s}" fill="url(#${visor})"/>`);
    // eyes
    for (const ex of [cx - 52 * s, cx + 52 * s]) {
      g.push(`<circle cx="${ex}" cy="${cy - hh / 2 + 40 * s + hh * 0.25}" r="${20 * s}" fill="${h(c.accent)}" filter="url(#${glow})"/>`);
      g.push(`<circle cx="${ex + 6 * s}" cy="${cy - hh / 2 + 34 * s + hh * 0.25}" r="${6 * s}" fill="#FFFFFF" opacity="0.9"/>`);
    }
    // mouth grille
    for (let i = 0; i < 5; i++) g.push(`<rect x="${cx - 50 * s + i * 22 * s}" y="${cy + hh / 2 - 46 * s}" width="${12 * s}" height="${18 * s}" rx="${3 * s}" fill="${h(c.accent2)}" opacity="0.8"/>`);
    // panel lines / bolts
    g.push(`<circle cx="${cx - w / 2 + 22 * s}" cy="${cy - hh / 2 + 22 * s}" r="${4 * s}" fill="${h(c.muted)}"/><circle cx="${cx + w / 2 - 22 * s}" cy="${cy - hh / 2 + 22 * s}" r="${4 * s}" fill="${h(c.muted)}"/>`);
    return g.join("");
  };
  if (hero) out.push(head(730, 250, 1));
  else out.push(`<g opacity="0.85">${head(895, 66, 0.3)}</g>`);
  return out.join("");
}

function neural(x: Ctx) {
  const { c, hero } = x;
  const out = [wash(x, 0.08)];
  const glow = glowFilter(x, 4);
  const layers = hero ? [3, 5, 6, 5, 2] : [2, 4, 3];
  const x0 = hero ? 500 : 790,
    x1 = hero ? 920 : 940;
  const y0 = hero ? 70 : 22,
    y1 = hero ? 470 : 170;
  const nodes = layers.map((n, li) =>
    Array.from({ length: n }, (_, k) => [x0 + (li / (layers.length - 1)) * (x1 - x0), y0 + ((k + 0.5) / n) * (y1 - y0) + (x.r() - 0.5) * 10]),
  );
  const edges: string[] = [];
  const g = linGrad(x, c.accent, c.accent2, 1, 0);
  for (let li = 0; li < nodes.length - 1; li++)
    for (const a of nodes[li])
      for (const b of nodes[li + 1]) {
        const hot = x.r() > 0.82;
        edges.push(`<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${hot ? `url(#${g})` : h(c.muted)}" stroke-width="${hot ? 2.2 : 1}" opacity="${hot ? 0.9 : 0.25}"/>`);
      }
  out.push(`<g opacity="${hero ? 1 : 0.6}">${edges.join("")}`);
  nodes.forEach((layer, li) =>
    layer.forEach(([px, py]) => {
      const col = li % 2 ? c.accent2 : c.accent;
      out.push(`<circle cx="${f(px)}" cy="${f(py)}" r="${hero ? 13 : 7}" fill="${h(c.bg)}" stroke="${h(col)}" stroke-width="2.5" filter="url(#${glow})"/><circle cx="${f(px)}" cy="${f(py)}" r="${hero ? 5 : 3}" fill="${h(col)}"/>`);
    }),
  );
  out.push(`</g>`);
  return out.join("");
}

function matrix(x: Ctx) {
  const { c, hero } = x;
  const out = [wash(x, 0.05)];
  const chars = "01アイウエオカキクケコ0123456789ABCDEF";
  const xStart = hero ? 470 : 840;
  const glow = glowFilter(x, 2.5);
  const cols: string[] = [];
  for (let px = xStart; px < W; px += 19) {
    const len = 6 + Math.floor(x.r() * (hero ? 22 : 10));
    const start = Math.floor(x.r() * 20) * 20 - 100;
    for (let k = 0; k < len; k++) {
      const py = start + k * 20;
      if (py < 0 || py > H) continue;
      const head = k === len - 1;
      const op = head ? 1 : f(0.15 + (k / len) * 0.7);
      const ch = chars[Math.floor(x.r() * chars.length)];
      cols.push(`<text x="${px}" y="${py}" font-family="Courier New, monospace" font-size="16" font-weight="bold" fill="${h(head ? lighten(c.accent, 0.7) : c.accent)}" opacity="${op}">${ch}</text>`);
    }
  }
  // Fade the left edge of the rain
  const fade = linGrad(x, c.bg, c.bg, 1, 0, 1, 0);
  out.push(`<g filter="url(#${glow})" opacity="${hero ? 0.9 : 0.55}">${cols.join("")}</g>`);
  out.push(`<rect x="${xStart - 10}" y="0" width="${hero ? 200 : 80}" height="${H}" fill="url(#${fade})"/>`);
  return out.join("");
}

function molecule(x: Ctx) {
  const { c, hero } = x;
  const out = [wash(x, 0.06)];
  // Hex grid pattern
  const pid = x.uid();
  const hs = 26;
  const hexPath = (cx: number, cy: number, r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      return `${i ? "L" : "M"}${f(cx + r * Math.cos(a))} ${f(cy + r * Math.sin(a))}`;
    }).join("") + "Z";
  x.defs.push(`<pattern id="${pid}" width="${f(hs * 1.732)}" height="${hs * 3}" patternUnits="userSpaceOnUse"><path d="${hexPath(hs * 0.866, hs, hs)} ${hexPath(0, hs * 2.5, hs)} ${hexPath(hs * 1.732, hs * 2.5, hs)}" fill="none" stroke="${h(c.accent)}" stroke-width="1"/></pattern>`);
  out.push(`<rect width="${W}" height="${H}" fill="url(#${pid})" opacity="${hero ? 0.08 : 0.06}"/>`);
  const mol = (cx: number, cy: number, R: number, ar: number) => {
    const atoms: number[][] = [];
    const ring = (ox: number, oy: number) => Array.from({ length: 6 }, (_, i) => [ox + R * Math.cos((Math.PI / 3) * i), oy + R * Math.sin((Math.PI / 3) * i)]);
    const r1 = ring(cx, cy);
    const r2 = ring(cx + R * 1.5, cy + R * 0.866);
    const r3 = ring(cx + R * 1.5, cy - R * 0.866);
    for (const p of [...r1, ...r2, ...r3]) if (!atoms.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 2)) atoms.push(p);
    const side = [
      [cx - R * 2, cy],
      [cx - R * 2.6, cy - R * 0.9],
      [cx + R * 3.2, cy + R * 1.2],
      [cx + R * 1.5, cy - R * 2.6],
    ];
    const bonds: string[] = [];
    for (let i = 0; i < atoms.length; i++)
      for (let j = i + 1; j < atoms.length; j++) {
        const d = Math.hypot(atoms[i][0] - atoms[j][0], atoms[i][1] - atoms[j][1]);
        if (d < R * 1.05) bonds.push(`<line x1="${f(atoms[i][0])}" y1="${f(atoms[i][1])}" x2="${f(atoms[j][0])}" y2="${f(atoms[j][1])}" stroke="${h(c.muted)}" stroke-width="${f(ar * 0.45)}" stroke-linecap="round"/>`);
      }
    bonds.push(`<line x1="${f(r1[3][0])}" y1="${f(r1[3][1])}" x2="${f(side[0][0])}" y2="${f(side[0][1])}" stroke="${h(c.muted)}" stroke-width="${f(ar * 0.45)}"/>`);
    bonds.push(`<line x1="${f(side[0][0])}" y1="${f(side[0][1])}" x2="${f(side[1][0])}" y2="${f(side[1][1])}" stroke="${h(c.muted)}" stroke-width="${f(ar * 0.45)}"/>`);
    const far = atoms.reduce((m, p) => (p[0] > m[0] ? p : m), atoms[0]);
    bonds.push(`<line x1="${f(far[0])}" y1="${f(far[1])}" x2="${f(side[2][0])}" y2="${f(side[2][1])}" stroke="${h(c.muted)}" stroke-width="${f(ar * 0.45)}"/>`);
    const top = atoms.reduce((m, p) => (p[1] < m[1] ? p : m), atoms[0]);
    bonds.push(`<line x1="${f(top[0])}" y1="${f(top[1])}" x2="${f(side[3][0])}" y2="${f(side[3][1])}" stroke="${h(c.muted)}" stroke-width="${f(ar * 0.45)}"/>`);
    const balls = [...atoms.map((p, i) => sphere(x, p[0], p[1], ar, i % 4 === 0 ? c.accent2 : c.accent)), ...side.map((p, i) => sphere(x, p[0], p[1], ar * (i % 2 ? 0.7 : 1.15), i % 2 ? c.muted : c.accent2))];
    return bonds.join("") + balls.join("");
  };
  if (hero) out.push(mol(715, 300, 58, 16));
  else out.push(`<g opacity="0.75">${mol(850, 80, 22, 7)}</g>`);
  return out.join("");
}

function dna(x: Ctx) {
  const { c, hero } = x;
  const out = [wash(x, 0.08)];
  const cx = hero ? 730 : 905;
  const amp = hero ? 95 : 34;
  const step = hero ? 24 : 16;
  const items: { z: number; svg: string }[] = [];
  for (let i = -1; i * step < H + 20; i++) {
    const y = i * step + 8;
    const ph = i * 0.42;
    const xA = cx + amp * Math.sin(ph),
      xB = cx - amp * Math.sin(ph);
    const zA = Math.cos(ph),
      zB = -zA;
    const rb = hero ? 9 : 4.5;
    items.push({ z: Math.min(zA, zB) - 0.1, svg: `<line x1="${f(xA)}" y1="${y}" x2="${f(xB)}" y2="${y}" stroke="${h(c.muted)}" stroke-width="${hero ? 3 : 1.6}" opacity="0.45"/>` });
    items.push({ z: zA, svg: sphere(x, xA, y, rb * (0.75 + 0.35 * (zA + 1) / 2), c.accent, f(0.45 + 0.55 * (zA + 1) / 2)) });
    items.push({ z: zB, svg: sphere(x, xB, y, rb * (0.75 + 0.35 * (zB + 1) / 2), c.accent2, f(0.45 + 0.55 * (zB + 1) / 2)) });
  }
  items.sort((a, b) => a.z - b.z);
  if (hero) {
    const blur = blurFilter(x, 60);
    out.push(`<ellipse cx="${cx}" cy="270" rx="160" ry="260" fill="${h(c.accent)}" opacity="0.18" filter="url(#${blur})"/>`);
  }
  out.push(`<g opacity="${hero ? 1 : 0.7}">${items.map((i) => i.svg).join("")}</g>`);
  return out.join("");
}

function atom(x: Ctx) {
  const { c, hero } = x;
  const out = [wash(x, 0.08)];
  const glow = glowFilter(x, 5);
  const draw = (cx: number, cy: number, s: number) => {
    const g: string[] = [];
    const rx = 220 * s,
      ry = 72 * s;
    for (const [k, rot] of [0, 60, 120].entries()) {
      const col = k === 1 ? c.accent2 : c.accent;
      g.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${h(col)}" stroke-width="${f(2.5 * Math.max(s, 0.6))}" opacity="0.8" transform="rotate(${rot} ${cx} ${cy})"/>`);
      const a = (k * 2.1 + 0.6) % (Math.PI * 2);
      const ex = rx * Math.cos(a),
        ey = ry * Math.sin(a);
      const rr = (rot * Math.PI) / 180;
      g.push(`<circle cx="${f(cx + ex * Math.cos(rr) - ey * Math.sin(rr))}" cy="${f(cy + ex * Math.sin(rr) + ey * Math.cos(rr))}" r="${f(9 * s)}" fill="${h(col)}" filter="url(#${glow})"/>`);
    }
    const nuc: string[] = [];
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4,
        d = (i ? 18 : 0) * s * (0.6 + (i % 3) * 0.25);
      nuc.push(sphere(x, cx + d * Math.cos(a), cy + d * Math.sin(a), 17 * s, i % 2 ? c.accent2 : c.accent));
    }
    return g.join("") + nuc.join("");
  };
  if (hero) {
    const blur = blurFilter(x, 40);
    out.push(`<circle cx="720" cy="270" r="120" fill="${h(c.accent)}" opacity="0.3" filter="url(#${blur})"/>`);
    out.push(draw(720, 270, 1));
  } else out.push(`<g opacity="0.7">${draw(880, 78, 0.33)}</g>`);
  return out.join("");
}

function cells(x: Ctx) {
  const { c, hero } = x;
  const out = [wash(x, 0.06)];
  const cell = (cx: number, cy: number, r: number, col: string) => {
    const g = x.uid();
    x.defs.push(`<radialGradient id="${g}" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="${h(lighten(col, 0.7))}" stop-opacity="0.55"/><stop offset="0.85" stop-color="${h(col)}" stop-opacity="0.3"/><stop offset="1" stop-color="${h(col)}" stop-opacity="0.7"/></radialGradient>`);
    const blobs = Array.from({ length: 4 }, () => {
      const a = x.r() * 6.28,
        d = x.r() * r * 0.55;
      return `<circle cx="${f(cx + d * Math.cos(a))}" cy="${f(cy + d * Math.sin(a))}" r="${f(r * (0.06 + x.r() * 0.06))}" fill="${h(darken(col, 0.2))}" opacity="0.6"/>`;
    }).join("");
    return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#${g})" stroke="${h(col)}" stroke-width="2.5"/>${blobs}<circle cx="${f(cx + r * 0.12)}" cy="${f(cy - r * 0.08)}" r="${f(r * 0.3)}" fill="${h(c.accent2)}" opacity="0.75"/><circle cx="${f(cx + r * 0.05)}" cy="${f(cy - r * 0.14)}" r="${f(r * 0.1)}" fill="#FFFFFF" opacity="0.6"/>`;
  };
  if (hero) {
    // Microscope lens view
    const clip = x.uid();
    x.defs.push(`<clipPath id="${clip}"><circle cx="720" cy="270" r="230"/></clipPath>`);
    out.push(`<circle cx="720" cy="270" r="236" fill="${h(blend(c.bg, c.accent, 0.1))}" stroke="${h(c.accent)}" stroke-width="4"/>`);
    const inner: string[] = [];
    const spots = [
      [660, 220, 85],
      [800, 330, 70],
      [820, 160, 46],
      [610, 370, 52],
      [740, 430, 34],
      [540, 250, 40],
      [900, 260, 38],
    ];
    spots.forEach(([px, py, rr], i) => inner.push(cell(px, py, rr, i % 3 === 2 ? c.accent2 : c.accent)));
    out.push(`<g clip-path="url(#${clip})">${inner.join("")}</g>`);
    out.push(`<circle cx="720" cy="270" r="250" fill="none" stroke="${h(c.muted)}" stroke-width="1" stroke-dasharray="3 7" opacity="0.6"/>`);
  } else {
    out.push(`<g opacity="0.55">${cell(920, 40, 70, c.accent)}${cell(830, 110, 28, c.accent2)}${cell(30, 520, 56, c.accent)}</g>`);
  }
  return out.join("");
}

function blueprint(x: Ctx) {
  const { c, hero } = x;
  const out = [`<rect width="${W}" height="${H}" fill="${h(c.bg)}"/>`];
  const small = x.uid(),
    big = x.uid();
  x.defs.push(`<pattern id="${small}" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="${h(c.text)}" stroke-width="0.6" opacity="0.18"/></pattern>`);
  x.defs.push(`<pattern id="${big}" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="${h(c.text)}" stroke-width="1.2" opacity="0.28"/></pattern>`);
  out.push(`<rect width="${W}" height="${H}" fill="url(#${small})"/><rect width="${W}" height="${H}" fill="url(#${big})"/>`);
  const gear = (cx: number, cy: number, R: number, teeth: number, op: number) => {
    const pts: string[] = [];
    for (let i = 0; i < teeth * 2; i++) {
      const a0 = (i * Math.PI) / teeth,
        a1 = ((i + 1) * Math.PI) / teeth;
      const rr = i % 2 ? R : R * 1.16;
      pts.push(`${i ? "L" : "M"}${f(cx + rr * Math.cos(a0))} ${f(cy + rr * Math.sin(a0))} L${f(cx + rr * Math.cos(a1))} ${f(cy + rr * Math.sin(a1))}`);
    }
    const st = `fill="none" stroke="${h(c.text)}" stroke-width="1.8"`;
    return `<g opacity="${op}"><path d="${pts.join(" ")}Z" ${st}/><circle cx="${cx}" cy="${cy}" r="${f(R * 0.62)}" ${st}/><circle cx="${cx}" cy="${cy}" r="${f(R * 0.2)}" ${st}/><line x1="${f(cx - R * 1.45)}" y1="${cy}" x2="${f(cx + R * 1.45)}" y2="${cy}" stroke="${h(c.accent2)}" stroke-width="1" stroke-dasharray="10 4 2 4"/><line x1="${cx}" y1="${f(cy - R * 1.45)}" x2="${cx}" y2="${f(cy + R * 1.45)}" stroke="${h(c.accent2)}" stroke-width="1" stroke-dasharray="10 4 2 4"/></g>`;
  };
  if (hero) {
    out.push(gear(730, 250, 120, 14, 0.95), gear(880, 420, 62, 10, 0.85), gear(575, 420, 44, 8, 0.75));
    out.push(`<g stroke="${h(c.accent2)}" stroke-width="1.2" fill="none" opacity="0.9"><line x1="610" y1="80" x2="850" y2="80"/><path d="M610 74 V86 M850 74 V86"/></g>`);
    out.push(`<text x="730" y="72" font-family="Courier New, monospace" font-size="13" fill="${h(c.accent2)}" text-anchor="middle">Ø 240.00</text>`);
    out.push(`<rect x="770" y="470" width="170" height="50" fill="none" stroke="${h(c.text)}" stroke-width="1.2" opacity="0.7"/><line x1="770" y1="495" x2="940" y2="495" stroke="${h(c.text)}" opacity="0.5"/>`);
  } else out.push(gear(905, 55, 48, 10, 0.5));
  return out.join("");
}

function topo(x: Ctx) {
  const { c, hero } = x;
  const out = [wash(x, 0.05)];
  const contour = (cx: number, cy: number, levels: number, step: number, op: number) => {
    const seeds = [x.r() * 6, x.r() * 6, x.r() * 6];
    const g: string[] = [];
    for (let k = 1; k <= levels; k++) {
      const r0 = k * step;
      const pts: string[] = [];
      for (let i = 0; i <= 72; i++) {
        const a = (i / 72) * Math.PI * 2;
        const rr = r0 * (1 + 0.18 * Math.sin(3 * a + seeds[0]) + 0.1 * Math.sin(5 * a + seeds[1] + k * 0.2) + 0.06 * Math.cos(7 * a + seeds[2]));
        pts.push(`${i ? "L" : "M"}${f(cx + rr * Math.cos(a))} ${f(cy + rr * Math.sin(a) * 0.8)}`);
      }
      g.push(`<path d="${pts.join("")}Z" fill="none" stroke="${h(k % 5 === 0 ? c.accent2 : c.accent)}" stroke-width="${k % 5 === 0 ? 2 : 1.1}"/>`);
    }
    return `<g opacity="${op}">${g.join("")}</g>`;
  };
  if (hero) {
    out.push(contour(760, 280, 16, 20, 0.75));
    out.push(contour(500, 520, 8, 22, 0.35));
    out.push(`<circle cx="760" cy="280" r="7" fill="${h(c.accent2)}"/><text x="775" y="276" font-family="Courier New, monospace" font-size="13" fill="${h(c.muted)}">2,847 m</text>`);
  } else {
    out.push(contour(960, 0, 10, 20, 0.35));
    out.push(contour(0, 560, 6, 22, 0.25));
  }
  return out.join("");
}

function space(x: Ctx) {
  const { c, hero } = x;
  const id = x.uid();
  x.defs.push(`<radialGradient id="${id}" cx="0.75" cy="0.4" r="0.9"><stop offset="0" stop-color="${h(blend(c.bg, c.accent, 0.25))}"/><stop offset="1" stop-color="${h(c.bg)}"/></radialGradient>`);
  const out = [`<rect width="${W}" height="${H}" fill="url(#${id})"/>`];
  const blur = blurFilter(x, 50);
  out.push(`<ellipse cx="${hero ? 640 : 860}" cy="${hero ? 120 : 60}" rx="260" ry="110" fill="${h(c.accent2)}" opacity="${hero ? 0.18 : 0.12}" filter="url(#${blur})"/>`);
  out.push(`<ellipse cx="${hero ? 820 : 100}" cy="${hero ? 430 : 500}" rx="220" ry="90" fill="${h(c.accent)}" opacity="${hero ? 0.2 : 0.1}" filter="url(#${blur})"/>`);
  for (let i = 0; i < (hero ? 170 : 90); i++) {
    const r = x.r() * x.r() * 1.8 + 0.3;
    out.push(`<circle cx="${f(x.r() * W)}" cy="${f(x.r() * H)}" r="${f(r)}" fill="#FFFFFF" opacity="${f(0.25 + x.r() * 0.7)}"/>`);
  }
  const planet = (cx: number, cy: number, R: number, ring: boolean) => {
    const g = sphereGrad(x, c.accent);
    const shade = x.uid();
    x.defs.push(`<radialGradient id="${shade}" cx="0.3" cy="0.3" r="0.9"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.6"/></radialGradient>`);
    const bands = Array.from({ length: 4 }, (_, i) => `<ellipse cx="${cx}" cy="${f(cy - R * 0.5 + i * R * 0.32)}" rx="${f(R * 0.98)}" ry="${f(R * 0.06)}" fill="${h(i % 2 ? c.accent2 : lighten(c.accent, 0.3))}" opacity="0.25"/>`).join("");
    const clip = x.uid();
    x.defs.push(`<clipPath id="${clip}"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>`);
    const ringBack = ring ? `<ellipse cx="${cx}" cy="${cy}" rx="${f(R * 1.75)}" ry="${f(R * 0.38)}" fill="none" stroke="${h(c.accent2)}" stroke-width="${f(R * 0.09)}" opacity="0.55" transform="rotate(-14 ${cx} ${cy})"/>` : "";
    const ringFront = ring
      ? `<path d="M${f(cx - R * 1.7)} ${f(cy + R * 0.42)} A${f(R * 1.75)} ${f(R * 0.38)} -14 0 0 ${f(cx + R * 1.7)} ${f(cy - R * 0.42)}" fill="none" stroke="${h(lighten(c.accent2, 0.3))}" stroke-width="${f(R * 0.09)}" opacity="0.85"/>`
      : "";
    return `${ringBack}<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${g})"/><g clip-path="url(#${clip})">${bands}</g><circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${shade})"/>${ringFront}`;
  };
  if (hero) {
    out.push(planet(735, 280, 140, true));
    out.push(sphere(x, 520, 110, 22, c.accent2));
  } else out.push(planet(915, 55, 62, true));
  return out.join("");
}

function synthwave(x: Ctx) {
  const { c, hero } = x;
  const sky = x.uid();
  x.defs.push(`<linearGradient id="${sky}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${h(darken(c.bg, 0.3))}"/><stop offset="0.7" stop-color="${h(blend(c.bg, c.accent, 0.35))}"/><stop offset="1" stop-color="${h(c.bg)}"/></linearGradient>`);
  const out = [`<rect width="${W}" height="${H}" fill="url(#${sky})"/>`];
  for (let i = 0; i < 70; i++) out.push(`<circle cx="${f(x.r() * W)}" cy="${f(x.r() * 260)}" r="${f(0.4 + x.r() * 1.2)}" fill="#FFFFFF" opacity="${f(0.2 + x.r() * 0.6)}"/>`);
  const horizon = hero ? 360 : 470;
  if (hero) {
    const sun = x.uid();
    x.defs.push(`<linearGradient id="${sun}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${h(c.accent2)}"/><stop offset="1" stop-color="${h(c.accent)}"/></linearGradient>`);
    const clip = x.uid();
    const bars = Array.from({ length: 6 }, (_, i) => `<rect x="560" y="${270 + i * 16}" width="340" height="${3 + i * 1.6}"/>`).join("");
    x.defs.push(`<mask id="${clip}"><rect width="${W}" height="${horizon}" fill="#fff"/><g fill="#000">${bars}</g></mask>`);
    const blur = blurFilter(x, 30);
    out.push(`<circle cx="730" cy="270" r="150" fill="${h(c.accent)}" opacity="0.45" filter="url(#${blur})"/>`);
    out.push(`<circle cx="730" cy="270" r="135" fill="url(#${sun})" mask="url(#${clip})"/>`);
    // mountains
    out.push(`<polygon points="430,${horizon} 520,300 590,${horizon - 20} 660,280 760,${horizon - 10} 840,310 960,${horizon - 30} 960,${horizon} " fill="${h(darken(c.bg, 0.2))}" opacity="0.95"/>`);
  }
  out.push(`<rect y="${horizon}" width="${W}" height="${H - horizon}" fill="${h(darken(c.bg, 0.15))}"/>`);
  const glow = glowFilter(x, 2.5);
  const grid: string[] = [];
  const vx = hero ? 730 : 480;
  for (let k = -20; k <= 20; k++) grid.push(`<line x1="${vx + k * 14}" y1="${horizon}" x2="${vx + k * 110}" y2="${H}" stroke="${h(c.accent)}" stroke-width="1.4"/>`);
  for (let k = 0; k < 9; k++) {
    const y = horizon + Math.pow(k / 8, 1.8) * (H - horizon);
    grid.push(`<line x1="0" y1="${f(y)}" x2="${W}" y2="${f(y)}" stroke="${h(c.accent)}" stroke-width="1.4"/>`);
  }
  out.push(`<g filter="url(#${glow})" opacity="${hero ? 0.85 : 0.55}">${grid.join("")}</g>`);
  return out.join("");
}

function aurora(x: Ctx) {
  const { c, hero } = x;
  const out = [`<rect width="${W}" height="${H}" fill="${h(c.bg)}"/>`];
  const blur = blurFilter(x, hero ? 70 : 60);
  const blobs: [number, number, number, number, string, number][] = hero
    ? [
        [760, 120, 260, 160, c.accent, 0.75],
        [880, 400, 220, 170, c.accent2, 0.7],
        [560, 330, 200, 120, blend(c.accent, c.accent2, 0.5), 0.55],
        [180, 520, 260, 120, c.accent2, 0.3],
      ]
    : [
        [930, 20, 220, 130, c.accent, 0.55],
        [20, 540, 260, 130, c.accent2, 0.45],
      ];
  out.push(`<g filter="url(#${blur})">${blobs.map(([cx, cy, rx, ry, col, op]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${h(col)}" opacity="${op}"/>`).join("")}</g>`);
  if (hero) {
    // Glass card hint
    out.push(`<rect x="640" y="180" width="250" height="170" rx="24" fill="#FFFFFF" opacity="${x.dark ? 0.08 : 0.35}" stroke="#FFFFFF" stroke-opacity="0.4" transform="rotate(-8 765 265)"/>`);
    out.push(`<rect x="600" y="230" width="250" height="170" rx="24" fill="#FFFFFF" opacity="${x.dark ? 0.1 : 0.45}" stroke="#FFFFFF" stroke-opacity="0.5" transform="rotate(6 725 315)"/>`);
  }
  return out.join("");
}

function globe(x: Ctx) {
  const { c, hero } = x;
  const out = [wash(x, 0.1)];
  const glow = glowFilter(x, 3);
  const draw = (cx: number, cy: number, R: number, op: number) => {
    const g: string[] = [];
    const halo = blurFilter(x, 30);
    g.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="${h(c.accent)}" opacity="0.25" filter="url(#${halo})"/>`);
    const fill = sphereGrad(x, blend(c.bg, c.accent, 0.35));
    g.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#${fill})" opacity="0.55"/>`);
    for (let k = 1; k < 6; k++) {
      const yy = cy - R + (k * 2 * R) / 6;
      const rx = Math.sqrt(R * R - (yy - cy) ** 2);
      g.push(`<ellipse cx="${cx}" cy="${f(yy)}" rx="${f(rx)}" ry="${f(rx * 0.18)}" fill="none" stroke="${h(c.accent)}" stroke-width="1.2" opacity="0.7"/>`);
    }
    for (let k = 0; k < 6; k++) g.push(`<ellipse cx="${cx}" cy="${cy}" rx="${f(R * Math.abs(Math.cos((k * Math.PI) / 6)))}" ry="${R}" fill="none" stroke="${h(c.accent)}" stroke-width="1.2" opacity="0.7"/>`);
    g.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${h(c.accent2)}" stroke-width="2"/>`);
    // connection arcs + hubs
    const hubs = Array.from({ length: 7 }, () => {
      const a = x.r() * Math.PI * 2,
        d = Math.sqrt(x.r()) * R * 0.85;
      return [cx + d * Math.cos(a), cy + d * Math.sin(a)];
    });
    for (let i = 0; i < hubs.length - 1; i++) {
      const [ax, ay] = hubs[i],
        [bx, by] = hubs[i + 1];
      g.push(`<path d="M${f(ax)} ${f(ay)} Q${f((ax + bx) / 2)} ${f(Math.min(ay, by) - R * 0.35)} ${f(bx)} ${f(by)}" fill="none" stroke="${h(c.accent2)}" stroke-width="1.8" opacity="0.9"/>`);
    }
    hubs.forEach(([hx, hy]) => g.push(`<circle cx="${f(hx)}" cy="${f(hy)}" r="${f(R * 0.025 + 2)}" fill="${h(c.accent2)}"/>`));
    return `<g opacity="${op}" filter="url(#${glow})">${g.join("")}</g>`;
  };
  out.push(hero ? draw(730, 270, 200, 1) : draw(905, 60, 80, 0.6));
  return out.join("");
}

function labdata(x: Ctx) {
  const { c, hero } = x;
  const out = [`<rect width="${W}" height="${H}" fill="${h(c.bg)}"/>`];
  const pid = x.uid();
  x.defs.push(`<pattern id="${pid}" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="${h(c.accent)}" stroke-width="0.6" opacity="0.18"/></pattern>`);
  out.push(`<rect width="${W}" height="${H}" fill="url(#${pid})"/>`);
  const plot = (x0: number, y0: number, w: number, hh: number, op: number) => {
    const g: string[] = [`<line x1="${x0}" y1="${y0 + hh}" x2="${x0 + w}" y2="${y0 + hh}" stroke="${h(c.text)}" stroke-width="1.5"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 + hh}" stroke="${h(c.text)}" stroke-width="1.5"/>`];
    const curve = (col: string, k: number, amp: number) => {
      const pts: string[] = [];
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        pts.push(`${f(x0 + t * w)},${f(y0 + hh - hh * (0.15 + 0.7 * (1 / (1 + Math.exp(-(t - 0.5) * k))) + amp * Math.sin(t * 18)))}`);
      }
      return `<polyline points="${pts.join(" ")}" fill="none" stroke="${h(col)}" stroke-width="2.5"/>`;
    };
    g.push(curve(c.accent, 9, 0.02), curve(c.accent2, 5, 0.03));
    for (let i = 0; i < 14; i++) {
      const t = x.r();
      const v = 0.15 + 0.7 / (1 + Math.exp(-(t - 0.5) * 9)) + (x.r() - 0.5) * 0.12;
      g.push(`<circle cx="${f(x0 + t * w)}" cy="${f(y0 + hh - hh * v)}" r="4" fill="${h(c.bg)}" stroke="${h(c.accent)}" stroke-width="2"/>`);
    }
    return `<g opacity="${op}">${g.join("")}</g>`;
  };
  if (hero) {
    out.push(`<rect x="560" y="90" width="340" height="300" rx="10" fill="${h(c.surface)}" stroke="${h(c.muted)}" stroke-opacity="0.4"/>`);
    out.push(plot(590, 120, 280, 230, 1));
    out.push(`<g transform="translate(600 420)">${Array.from({ length: 5 }, (_, i) => `<rect x="${i * 56}" y="${f(50 - (20 + x.r() * 50))}" width="34" height="${f(20 + x.r() * 50)}" rx="4" fill="${h(i % 2 ? c.accent2 : c.accent)}" opacity="0.8"/>`).join("")}</g>`);
  } else out.push(plot(800, 26, 130, 90, 0.45));
  return out.join("");
}

const DRAW: Record<ArtStyle, (x: Ctx) => string> = {
  globe,
  labdata,
  iso,
  orbs,
  prism,
  lowpoly,
  tunnel,
  waves3d,
  circuit,
  hud,
  robot,
  neural,
  matrix,
  molecule,
  dna,
  atom,
  cells,
  blueprint,
  topo,
  space,
  synthwave,
  aurora,
};

const cache = new Map<string, string>();

/** Build the artwork SVG for a template + slide kind. Deterministic and cached. */
export function artSvg(style: ArtStyle, colors: ArtColors, hero: boolean, seed = 1): string {
  const key = `${style}|${hero}|${seed}|${Object.values(colors).join(",")}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let n = 0;
  const x: Ctx = { c: colors, hero, r: rng(seed * 7919 + style.length * 31), dark: isDark(colors.bg), defs: [], uid: () => `a${n++}` };
  const body = DRAW[style](x);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${x.defs.join("")}</defs>${body}</svg>`;
  if (cache.size > 400) cache.clear();
  cache.set(key, svg);
  return svg;
}

export function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Names used by templates and the Brand Vault "Art Blend" picker (aliases map onto styles). */
const ALIASES = { isometric: "iso", clay: "orbs", cosmos: "space", hexgrid: "molecule", orbitals: "atom", waves: "waves3d" } as const;
export type ArtKind = ArtStyle | keyof typeof ALIASES;

export const ART_LABELS: Record<ArtKind, string> = {
  iso: "Isometric blocks",
  isometric: "Isometric 3D",
  orbs: "Glossy orbs",
  clay: "Clay 3D",
  prism: "Glass prisms",
  lowpoly: "Low poly",
  tunnel: "Neon tunnel",
  waves3d: "3D waves",
  waves: "Layered waves",
  circuit: "Circuit board",
  hud: "Sci-fi HUD",
  robot: "Robot",
  neural: "Neural network",
  matrix: "Code rain",
  molecule: "Molecules",
  hexgrid: "Hex lattice",
  dna: "DNA helix",
  atom: "Atom",
  orbitals: "Orbitals",
  cells: "Microscope cells",
  blueprint: "Blueprint",
  topo: "Topographic",
  space: "Planet & stars",
  cosmos: "Cosmos",
  synthwave: "Synthwave",
  aurora: "Aurora glass",
  globe: "Wireframe globe",
  labdata: "Lab data",
};

/** Art Blend picker: one entry per distinct look. */
export const ART_CHOICES: ArtKind[] = ["isometric", "orbs", "prism", "lowpoly", "tunnel", "waves3d", "circuit", "hud", "robot", "neural", "matrix", "molecule", "dna", "orbitals", "cells", "blueprint", "topo", "cosmos", "globe", "synthwave", "aurora"];

export function resolveArt(kind: ArtKind): ArtStyle {
  return (ALIASES as Record<string, ArtStyle>)[kind] ?? (kind as ArtStyle);
}

/** Artwork as an <img>-ready data URL. Colors are the template's (hex, no #). */
export function artDataUrl(kind: ArtKind, col: { bg: string; a: string; b: string; text: string; dark: boolean }, hero: boolean, seed = 0) {
  const colors: ArtColors = {
    bg: col.bg,
    text: col.text,
    accent: col.a,
    accent2: col.b,
    muted: blend(col.text, col.bg, 0.45),
    surface: blend(col.bg, col.dark ? "FFFFFF" : col.text, col.dark ? 0.1 : 0.04),
  };
  return svgDataUrl(artSvg(resolveArt(kind), colors, hero, seed + 1));
}
