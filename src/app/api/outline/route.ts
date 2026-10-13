import { Output, streamText } from "ai";
import { outlineSchema, type GenOptions, type Source } from "@/lib/schema";
import { DESIGN_RULES, NDJSON, hasAI, ndjsonOnce, ndjsonStream, optionsText, sourceText, getModel } from "@/lib/prompts";
import { demoOutline } from "@/lib/demo";

export const maxDuration = 120;

export async function POST(req: Request) {
  const { source, options } = (await req.json()) as { source: Source; options: GenOptions };
  if (!source?.prompt?.trim() && !source?.text?.trim()) {
    return Response.json({ error: "Add a prompt, paste text, or upload a document." }, { status: 400 });
  }
  const count = Math.min(Math.max(Number(options.slideCount) || 8, 3), 25);

  if (!hasAI()) return ndjsonOnce(demoOutline(source, count), { demo: true });

  let failure: unknown;
  const result = streamText({
    onError: ({ error }) => {
      failure = error;
    },
    model: getModel(),
    maxRetries: 5,
    instructions: `You are a world-class presentation strategist. Plan a compelling, well-structured presentation outline with a clear narrative arc (hook → context → substance → evidence → call to action).
${DESIGN_RULES}`,
    prompt: `${sourceText(source)}

Number of slides: exactly ${count}
${optionsText(options)}`,
    output: Output.object({ schema: outlineSchema }),
  });

  return new Response(ndjsonStream(result.partialOutputStream, result.output, () => failure), { headers: NDJSON });
}
