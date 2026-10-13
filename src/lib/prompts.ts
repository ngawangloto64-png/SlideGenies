import type { GenOptions, Source } from "./schema";

export { getModel, hasAI } from "./model";


const DENSITY: Record<GenOptions["density"], string> = {
  Minimal: "Very little text: headlines under 6 words, at most 3 bullets per slide, bullets under 8 words.",
  Balanced: "Scannable text: headlines under 8 words, 3-5 bullets, bullets under 14 words.",
  Detailed: "Richer text: headlines under 10 words, 4-6 bullets, bullets up to 22 words, fuller speaker notes.",
};

export const DESIGN_RULES = `Design rules:
- The first slide uses the "title" layout; the last slide uses the "closing" layout.
- Vary layouts across the deck: mix bullets, twoColumn, cards, stats, chart, timeline, imageText, quote and section slides where they fit. Never repeat a layout more than twice in a row.
- Use "chart" whenever content involves numbers that compare, change over time or form parts of a whole. Provide realistic, clearly approximate data; values arrays must match labels length.
- Use "stats" for 3-4 headline numbers. Prefer well-known figures; avoid fake precision.
- Give every card and timeline item a single fitting emoji in "icon". Give imageText slides an emoji "icon".
- Only fill the fields the chosen layout uses.
- Write brief speaker notes for every slide.`;

export function optionsText(o: GenOptions) {
  return `Tone: ${o.tone}
Audience: ${o.audience || "General audience"}
Text density: ${DENSITY[o.density] ?? DENSITY.Balanced}
Language: write ALL content in ${o.language || "English"}.`;
}

export function sourceText(s: Source) {
  const parts = [`Request: ${s.prompt || "Create a presentation from the source material."}`];
  if (s.text?.trim()) {
    parts.push(
      `Source material${s.fileName ? ` (from ${s.fileName})` : ""} — base the presentation on this, stay faithful to its facts:\n"""\n${s.text.slice(0, 60000)}\n"""`,
    );
  }
  return parts.join("\n\n");
}

/** Turn provider / gateway failures into a message a user can act on. */
export function friendlyError(err: unknown): string {
  const e = err as { responseBody?: string; statusCode?: number; message?: string } | undefined;
  let msg = e?.message ?? "Generation failed";
  let type = "";
  try {
    const body = e?.responseBody ? JSON.parse(e.responseBody) : undefined;
    if (body?.error?.message) msg = body.error.message;
    type = body?.error?.type ?? "";
  } catch {}
  if (type === "customer_verification_required" || /credit card/i.test(msg))
    return "Your Vercel AI Gateway account needs a credit card on file before it can run (this also unlocks the free credits). Add one in the Vercel dashboard → AI Gateway, then try again.";
  if (e?.statusCode === 401 || /invalid api key|unauthorized/i.test(msg)) return "The AI key was rejected. Check the key in .env.local and restart the app.";
  if (e?.statusCode === 402 || /insufficient|quota|balance/i.test(msg)) return "Your AI Gateway credits have run out. Top up in the Vercel dashboard → AI Gateway.";
  if (/ECONNREFUSED|fetch failed|Cannot connect/i.test(msg + String((e as { cause?: unknown })?.cause ?? "")))
    return "Can't reach the local AI (Ollama). Start it with “brew services start ollama” (or open the Ollama app), then try again.";
  if (/model .* not found|pull/i.test(msg)) return "The local AI model isn't downloaded yet. Run “ollama pull qwen2.5:7b”, then try again.";
  if (e?.statusCode === 503 || /high demand|overloaded|UNAVAILABLE/i.test(msg)) return "The free AI is very busy right now. Please wait a moment and try again.";
  if (e?.statusCode === 429) return "Too many requests right now — wait a few seconds and try again.";
  return msg;
}

export function line(obj: unknown) {
  return JSON.stringify(obj) + "\n";
}

/** Stream partial structured output as NDJSON lines. */
export function ndjsonStream<T>(partials: AsyncIterable<unknown>, final: PromiseLike<T>, cause?: () => unknown) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        let last = 0;
        for await (const partial of partials) {
          const now = Date.now();
          if (now - last > 120) {
            controller.enqueue(encoder.encode(line({ type: "partial", data: partial })));
            last = now;
          }
        }
        controller.enqueue(encoder.encode(line({ type: "done", data: await final })));
      } catch (err) {
        const message = friendlyError(cause?.() ?? err);
        controller.enqueue(encoder.encode(line({ type: "error", error: message })));
      } finally {
        controller.close();
      }
    },
  });
}

export function ndjsonOnce(data: unknown, extra: Record<string, unknown> = {}) {
  return new Response(line({ type: "done", data, ...extra }), { headers: { "Content-Type": "application/x-ndjson" } });
}

export const NDJSON = { "Content-Type": "application/x-ndjson" };
