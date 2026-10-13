import type { Deck } from "./schema";

/** Demo deck used to preview templates: one slide per layout. */
export const SAMPLE_DECK: Deck = {
  title: "Project Nova",
  slides: [
    { layout: "title", title: "Project Nova: The Next Leap", subtitle: "Strategy review · Q3 2026" },
    { layout: "bullets", title: "Why Now", bullets: ["Demand is up 3x since last year", "Costs dropped as the tech matured", "Competitors are still a year behind", "Our team has the right expertise"] },
    { layout: "stats", title: "By the Numbers", stats: [{ value: "3.2x", label: "user growth" }, { value: "48%", label: "lower cost" }, { value: "12M", label: "people reached" }] },
    { layout: "cards", title: "Three Pillars", items: [{ heading: "Build", text: "Ship a focused core product in 90 days.", icon: "🚀" }, { heading: "Grow", text: "Partner with leaders in each market.", icon: "📈" }, { heading: "Scale", text: "Automate everything that repeats.", icon: "⚙️" }] },
    { layout: "chart", title: "Revenue Momentum", subtitle: "Annual revenue, $M", chart: { type: "bar", labels: ["2022", "2023", "2024", "2025", "2026"], series: [{ name: "Revenue", values: [4, 7, 12, 19, 31] }] } },
    { layout: "section", title: "The Roadmap", subtitle: "From pilot to global" },
    { layout: "timeline", title: "Milestones", items: [{ heading: "Q1", text: "Research & design" }, { heading: "Q2", text: "Pilot launch" }, { heading: "Q3", text: "Public release" }, { heading: "Q4", text: "Go global" }] },
    { layout: "twoColumn", title: "Before vs. After", left: { heading: "Today", bullets: ["Manual work", "Slow decisions", "Siloed data"] }, right: { heading: "With Nova", bullets: ["Automated flows", "Real-time insight", "One shared view"] } },
    { layout: "quote", title: "Vision", quote: "The best way to predict the future is to invent it.", author: "Alan Kay" },
    { layout: "closing", title: "Let's Build It", subtitle: "Questions & next steps" },
  ],
};
