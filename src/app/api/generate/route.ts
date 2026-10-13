import { Output, streamText } from "ai";
import { deckSchema, type GenOptions, type Outline, type Source } from "@/lib/schema";
import { DESIGN_RULES, NDJSON, hasAI, ndjsonOnce, ndjsonStream, optionsText, sourceText, getModel } from "@/lib/prompts";
import { demoDeckFromOutline } from "@/lib/demo";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { outline, source, options } = (await req.json()) as { outline: Outline; source: Source; options: GenOptions };
  if (!outline?.slides?.length) return Response.json({ error: "The outline is empty." }, { status: 400 });

  if (!hasAI()) return ndjsonOnce(demoDeckFromOutline(outline), { demo: true });

  let failure: unknown;
  const result = streamText({
    onError: ({ error }) => {
      failure = error;
    },
    model: getModel(),
    maxRetries: 5,
    instructions: `You are an expert presentation designer and storyteller. Turn the approved outline into finished slides.
Follow the outline exactly: same number of slides, same order, same headlines (you may polish wording) and the requested layout for each slide.
${DESIGN_RULES}`,
    prompt: `${sourceText(source)}

Approved outline (JSON):
${JSON.stringify(outline)}

${optionsText(options)}`,
    output: Output.object({ schema: deckSchema }),
  });

  return new Response(ndjsonStream(result.partialOutputStream, result.output, () => failure), { headers: NDJSON });
}
