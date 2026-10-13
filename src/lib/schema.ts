import { z } from "zod";

export const LAYOUTS = [
  "title",
  "section",
  "bullets",
  "twoColumn",
  "cards",
  "stats",
  "chart",
  "timeline",
  "imageText",
  "quote",
  "closing",
] as const;

export type Layout = (typeof LAYOUTS)[number];

export const LAYOUT_LABELS: Record<Layout, string> = {
  title: "Title",
  section: "Section divider",
  bullets: "Bullet points",
  twoColumn: "Two columns",
  cards: "Cards",
  stats: "Big numbers",
  chart: "Chart",
  timeline: "Timeline",
  imageText: "Image + text",
  quote: "Quote",
  closing: "Closing",
};

export const chartSchema = z.object({
  type: z.enum(["bar", "line", "pie", "doughnut"]),
  labels: z.array(z.string()).describe("Category labels, 3-7 items"),
  series: z
    .array(z.object({ name: z.string(), values: z.array(z.number()) }))
    .describe("1-3 series; each values array matches labels length. Pie/doughnut use exactly 1 series."),
  unit: z.string().optional().describe("Optional unit suffix such as % or $B"),
});

export const slideSchema = z.object({
  layout: z
    .enum(LAYOUTS)
    .describe(
      "title: opening slide. section: divider between parts. bullets: title + 3-6 bullets. " +
        "twoColumn: compare/contrast with left & right. cards: 3-4 short cards (heading+text+icon). " +
        "stats: 3-4 big numbers with labels. chart: data visualised as bar/line/pie/doughnut. " +
        "timeline: 3-5 ordered steps. imageText: a visual slide with 2-4 bullets beside an image. " +
        "quote: a memorable quote with author. closing: final thank-you / call to action.",
    ),
  title: z.string().describe("Slide headline, max ~8 words"),
  subtitle: z.string().optional().describe("Optional short supporting line"),
  bullets: z.array(z.string()).optional().describe("For bullets and imageText layouts"),
  left: z.object({ heading: z.string(), bullets: z.array(z.string()) }).optional().describe("For twoColumn layout"),
  right: z.object({ heading: z.string(), bullets: z.array(z.string()) }).optional().describe("For twoColumn layout"),
  items: z
    .array(z.object({ heading: z.string(), text: z.string(), icon: z.string().optional().describe("One emoji") }))
    .optional()
    .describe("For cards and timeline layouts"),
  stats: z.array(z.object({ value: z.string(), label: z.string() })).optional().describe("For stats layout"),
  chart: chartSchema.optional().describe("For chart layout"),
  quote: z.string().optional().describe("For quote layout"),
  author: z.string().optional().describe("For quote layout"),
  icon: z.string().optional().describe("One emoji representing the slide (used on imageText when no image)"),
  notes: z.string().optional().describe("Speaker notes, 1-3 sentences"),
});

export const deckSchema = z.object({
  title: z.string(),
  slides: z.array(slideSchema),
});

export const outlineSchema = z.object({
  title: z.string(),
  slides: z.array(
    z.object({
      title: z.string().describe("Slide headline"),
      layout: z.enum(LAYOUTS).describe("Best-fitting layout for this slide"),
      points: z.array(z.string()).describe("2-5 short key points the slide should cover"),
    }),
  ),
});

export type ImageData = { src: string; w: number; h: number };

/** AI-generated fields plus client-only extras (images, design variant). */
export type Slide = z.infer<typeof slideSchema> & {
  image?: ImageData;
  /** Alternate arrangement of the same layout ("New arrangement"). */
  variant?: number;
};
export type Deck = { title: string; slides: Slide[] };
export type Chart = z.infer<typeof chartSchema>;
export type Outline = z.infer<typeof outlineSchema>;
export type OutlineSlide = Outline["slides"][number];

export type Density = "Minimal" | "Balanced" | "Detailed";

export type GenOptions = {
  slideCount: number;
  tone: string;
  audience: string;
  density: Density;
  language: string;
};

export type Source = {
  mode: "prompt" | "text" | "file";
  prompt: string;
  /** Pasted text or extracted document text. */
  text?: string;
  fileName?: string;
};

/** How many variants each layout supports. */
export const VARIANTS: Partial<Record<Layout, number>> = {
  title: 2,
  bullets: 2,
  cards: 2,
  stats: 2,
  timeline: 2,
  imageText: 2,
  chart: 2,
};
