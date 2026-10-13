import type PptxGenJS from "pptxgenjs";
import type { Deck } from "./schema";
import type { ThemedTemplate } from "./templates";
import { layoutSlide, type El } from "./layout";

const IN = 72; // points per inch

function addEl(pptx: PptxGenJS, slide: PptxGenJS.Slide, el: El, images: Map<string, string>) {
  const pos = { x: el.x / IN, y: el.y / IN, w: el.w / IN, h: el.h / IN };

  if (el.kind === "image") {
    const data = (images.get(el.src) ?? el.src).replace(/^data:/, "");
    if (el.cover) {
      // pptxgenjs crops "cover" from the image's aspect ratio (w/h) into the sizing box.
      slide.addImage({ data, x: pos.x, y: pos.y, w: pos.w, h: (pos.w * el.imgH) / el.imgW, sizing: { type: "cover", w: pos.w, h: pos.h } });
    } else {
      const scale = Math.min(pos.w / el.imgW, pos.h / el.imgH);
      slide.addImage({ data, x: pos.x, y: pos.y, w: el.imgW * scale, h: el.imgH * scale });
    }
    return;
  }

  if (el.kind === "chart") {
    const { chart } = el;
    const pie = chart.type === "pie" || chart.type === "doughnut";
    const series = (pie ? chart.series.slice(0, 1) : chart.series).map((s) => ({ name: s.name, labels: chart.labels, values: s.values }));
    slide.addChart(chart.type, series, {
      ...pos,
      chartColors: el.colors,
      fontFace: el.font,
      showLegend: pie || chart.series.length > 1,
      legendPos: pie ? "r" : "t",
      legendFontSize: 13,
      legendColor: el.text,
      catAxisLabelColor: el.muted,
      valAxisLabelColor: el.muted,
      catAxisLabelFontSize: 12,
      valAxisLabelFontSize: 11,
      catAxisLineShow: false,
      valAxisLineShow: false,
      valGridLine: { color: el.grid, size: 0.75 },
      catGridLine: { style: "none" },
      barGapWidthPct: 60,
      showValue: chart.type === "bar",
      showPercent: pie,
      dataLabelColor: pie ? "FFFFFF" : el.text,
      dataLabelFontSize: 11,
      lineSize: 3,
      lineDataSymbol: "circle",
      lineDataSymbolSize: 8,
      holeSize: 55,
    });
    return;
  }

  if (el.kind === "rect" || el.kind === "ellipse") {
    const rounded = el.kind === "rect" && el.radius;
    const shape = el.kind === "ellipse" ? pptx.ShapeType.ellipse : rounded ? pptx.ShapeType.roundRect : pptx.ShapeType.rect;
    slide.addShape(shape, {
      ...pos,
      fill: el.fill ? { color: el.fill, transparency: Math.round((el.transparency ?? 0) * 100) } : { type: "none" },
      line: el.line ? { color: el.line, width: el.lineWidth ?? 1 } : { type: "none" },
      rotate: el.rotate,
      rectRadius: rounded ? Math.min(0.5, (el.radius ?? 0) / Math.min(el.w, el.h)) : undefined,
      shadow: el.shadow ? { type: "outer", blur: 14, offset: 5, angle: 90, color: "000000", opacity: 0.28 } : undefined,
    });
    return;
  }

  if (el.kind === "text") {
    slide.addText(el.text, {
      ...pos,
      fontFace: el.font,
      fontSize: el.size,
      color: el.color,
      bold: el.bold,
      italic: el.italic,
      shadow: el.shadow ? { type: "outer", blur: 8, offset: 3, angle: 90, color: el.shadow, opacity: 0.45 } : undefined,
      align: el.align ?? "left",
      valign: el.valign ?? "top",
      margin: 0,
      fit: "shrink",
    });
    return;
  }

  if (el.kind !== "bullets") return;
  slide.addText(
    el.items.map((item) => ({
      text: item,
      options: { bullet: { characterCode: "25CF", indent: Math.round(el.size * 1.1) }, breakLine: true },
    })),
    {
      ...pos,
      fontFace: el.font,
      fontSize: el.size,
      color: el.color,
      valign: "top",
      margin: 0,
      paraSpaceAfter: Math.round(el.size * 0.7),
      fit: "shrink",
    },
  );
}

/** PowerPoint needs base64 raster images: rasterize SVG artwork (browser) or base64-encode it (server/tests). */
async function toPptxImage(src: string): Promise<string> {
  if (!src.startsWith("data:image/svg+xml")) return src;
  const svg = decodeURIComponent(src.slice(src.indexOf(",") + 1));
  if (typeof document === "undefined") return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  const img = new Image();
  img.src = src;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 1920;
  canvas.height = Math.round((1920 * img.height) / img.width) || 1080;
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

export async function buildPptx(deck: Deck, template: ThemedTemplate) {
  const { default: Pptx } = await import("pptxgenjs");
  const pptx = new Pptx();
  pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in == 960 x 540 pt
  pptx.title = deck.title;

  const renders = deck.slides.map((s, i) => layoutSlide(s, template, i, deck.slides.length));
  const images = new Map<string, string>();
  for (const r of renders)
    for (const el of r.els) if (el.kind === "image" && !images.has(el.src)) images.set(el.src, await toPptxImage(el.src));

  deck.slides.forEach((s, i) => {
    const r = renders[i];
    const slide = pptx.addSlide();
    slide.background = { color: r.bg };
    r.els.forEach((el) => addEl(pptx, slide, el, images));
    if (s.notes) slide.addNotes(s.notes);
  });
  return pptx;
}

export function safeFileName(title: string) {
  return title.replace(/[^\w\s-]/g, "").trim().slice(0, 60) || "presentation";
}

export async function exportPptx(deck: Deck, template: ThemedTemplate) {
  const pptx = await buildPptx(deck, template);
  await pptx.writeFile({ fileName: `${safeFileName(deck.title)}.pptx` });
}
