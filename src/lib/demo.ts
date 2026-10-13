import type { Deck, Layout, Outline, OutlineSlide, Slide, Source } from "./schema";

/**
 * Offline fallbacks used only when no AI credentials are configured, so every
 * screen of the app stays usable. They are clearly labelled as demo content.
 */

const PATTERN: Layout[] = ["bullets", "stats", "cards", "chart", "twoColumn", "timeline", "imageText", "quote", "section", "bullets"];
const ICONS = ["🚀", "🎯", "💡", "📈", "🤝", "⚙️", "🌱", "🔒", "🧭", "⭐"];

function clip(s: string, words: number) {
  const w = s.replace(/\s+/g, " ").trim().split(" ");
  return w.length > words ? w.slice(0, words).join(" ") + "…" : w.join(" ");
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function sentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.split(" ").length >= 4);
}

export function demoOutline(source: Source, count: number): Outline {
  const topic = clip(source.prompt || source.fileName || "Your Presentation", 9);
  const body = Math.max(count - 2, 1);
  const slides: OutlineSlide[] = [{ title: titleCase(topic), layout: "title", points: ["Opening hook", "What this deck covers"] }];

  if (source.text?.trim()) {
    const sents = sentences(source.text);
    const per = Math.max(1, Math.floor(sents.length / body));
    for (let i = 0; i < body; i++) {
      const chunk = sents.slice(i * per, i * per + Math.min(per, 4));
      const head = chunk[0] ?? `Key idea ${i + 1}`;
      slides.push({ title: titleCase(clip(head, 5).replace(/[.…,:;]+$/, "")), layout: PATTERN[i % PATTERN.length], points: chunk.length ? chunk.map((c) => clip(c, 14)) : ["Supporting detail"] });
    }
  } else {
    const generic: [string, string[]][] = [
      ["Why It Matters Now", ["The landscape is shifting fast", "Early movers gain an advantage", "The cost of waiting is rising"]],
      ["By the Numbers", ["Growth rate", "Adoption", "Efficiency gains"]],
      ["Core Pillars", ["Strategy", "People", "Technology"]],
      ["Trend Over Time", ["Steady growth since 2020", "Acceleration expected"]],
      ["Today vs. Tomorrow", ["Current pain points", "Future state"]],
      ["Roadmap", ["Discover", "Pilot", "Scale", "Optimize"]],
      ["In Practice", ["A real-world example", "What worked", "Lessons learned"]],
      ["A Guiding Thought", ["Memorable quote"]],
      ["Going Deeper", ["Next level of detail"]],
      ["Risks & Mitigations", ["Adoption", "Budget", "Quality"]],
    ];
    for (let i = 0; i < body; i++) {
      const [t, p] = generic[i % generic.length];
      slides.push({ title: t, layout: PATTERN[i % PATTERN.length], points: p });
    }
  }
  slides.push({ title: "Thank You", layout: "closing", points: ["Questions & discussion"] });
  return { title: titleCase(topic), slides };
}

function slideFrom(o: OutlineSlide, i: number): Slide {
  const p = o.points.length ? o.points : ["Key point"];
  const base = { title: o.title, notes: `Talk through: ${p.join("; ")}.` };
  switch (o.layout) {
    case "title":
      return { ...base, layout: "title", subtitle: "Demo deck — connect a free AI for real content" };
    case "section":
      return { ...base, layout: "section", subtitle: p[0] };
    case "closing":
      return { ...base, layout: "closing", subtitle: p[0] };
    case "quote":
      return { ...base, layout: "quote", quote: "The best way to predict the future is to create it.", author: "Peter Drucker" };
    case "stats":
      return { ...base, layout: "stats", stats: [{ value: "3x", label: p[0] ?? "faster" }, { value: "42%", label: p[1] ?? "growth" }, { value: "#1", label: p[2] ?? "priority" }] };
    case "chart":
      return {
        ...base,
        layout: "chart",
        subtitle: p[0],
        chart: { type: "bar", labels: ["2021", "2022", "2023", "2024", "2025"], series: [{ name: "Growth", values: [12, 19, 27, 38, 52] }], unit: "%" },
      };
    case "twoColumn": {
      const half = Math.ceil(p.length / 2);
      return { ...base, layout: "twoColumn", left: { heading: "Today", bullets: p.slice(0, half).concat(half === p.length ? ["Manual and slow"] : []) }, right: { heading: "Tomorrow", bullets: p.slice(half).length ? p.slice(half) : ["Automated and fast"] } };
    }
    case "cards":
    case "timeline":
      return { ...base, layout: o.layout, items: p.slice(0, 4).map((x, k) => ({ heading: clip(x, 3).replace("…", ""), text: x, icon: ICONS[(i + k) % ICONS.length] })) };
    case "imageText":
      return { ...base, layout: "imageText", bullets: p, icon: ICONS[i % ICONS.length] };
    default:
      return { ...base, layout: "bullets", bullets: p };
  }
}

export function demoDeckFromOutline(outline: Outline): Deck {
  return { title: outline.title, slides: outline.slides.map(slideFrom) };
}

export function demoRevise(deck: Deck, instruction: string, slideIndex: number | null): { slide?: Slide; deck?: Deck; message: string } {
  const ins = instruction.toLowerCase();
  const shorten = (s: Slide): Slide => ({
    ...s,
    bullets: s.bullets?.slice(0, 3).map((b) => clip(b, 7)),
    items: s.items?.map((it) => ({ ...it, text: clip(it.text, 8) })),
    subtitle: s.subtitle ? clip(s.subtitle, 8) : s.subtitle,
  });
  const expand = (s: Slide): Slide => ({
    ...s,
    bullets: s.bullets ? [...s.bullets, "Additional supporting detail with a concrete example"] : s.bullets,
    items: s.items?.map((it) => ({ ...it, text: it.text + " — with a concrete, measurable outcome." })),
  });
  const visual = (s: Slide): Slide => {
    if (s.chart) {
      const v = s.chart.series[0]?.values ?? [];
      return { ...s, layout: "stats", stats: s.chart.labels.slice(-3).map((l, k) => ({ value: `${v[v.length - 3 + k] ?? ""}${s.chart?.unit ?? ""}`, label: l })) };
    }
    const pts = s.bullets ?? s.left?.bullets ?? [s.title];
    return { ...s, layout: "cards", items: pts.slice(0, 4).map((p, k) => ({ heading: clip(p, 3).replace("…", ""), text: p, icon: ICONS[k] })) };
  };
  const fn = /short|concise|less/.test(ins) ? shorten : /expand|more detail|longer/.test(ins) ? expand : /visual|card|icon/.test(ins) ? visual : null;
  const msg = fn ? "Applied a basic demo edit. Connect an AI key for real rewrites." : "Demo mode can only tighten, elaborate or visualize slides. Connect an AI key so Genie can grant any wish.";

  if (slideIndex !== null) {
    const s = deck.slides[slideIndex];
    return { slide: fn ? fn(s) : s, message: msg };
  }
  return { deck: fn ? { ...deck, slides: deck.slides.map((s) => (s.layout === "title" || s.layout === "closing" ? s : fn(s))) } : deck, message: msg };
}
