import { Output, generateText } from "ai";
import { z } from "zod";
import { deckSchema, slideSchema, type Deck, type GenOptions } from "@/lib/schema";
import { DESIGN_RULES, hasAI, optionsText, friendlyError, getModel } from "@/lib/prompts";
import { demoRevise } from "@/lib/demo";

export const maxDuration = 300;

type Body = {
  deck: Deck;
  instruction: string;
  /** Index of the slide to revise, or null for the whole deck. */
  slideIndex: number | null;
  options?: GenOptions;
};

/** Images are client-only and can be large; never send them to the model. */
function stripClientFields(deck: Deck): Deck {
  return { ...deck, slides: deck.slides.map((s) => ({ ...s, image: undefined, variant: undefined })) };
}

export async function POST(req: Request) {
  const { deck, instruction, slideIndex, options } = (await req.json()) as Body;
  if (!instruction?.trim()) return Response.json({ error: "Tell the AI what to change." }, { status: 400 });

  if (!hasAI()) return Response.json({ ...demoRevise(deck, instruction, slideIndex), demo: true });

  const clean = stripClientFields(deck);
  const settings = options ? optionsText(options) : "";

  try {
    if (slideIndex !== null && slideIndex !== undefined) {
      const { output } = await generateText({
        model: getModel(),
    maxRetries: 2,
        instructions: `You are Peti, PePeTi's slide assistant, editing ONE slide of a deck. Apply the user's instruction to that slide only and return the full revised slide. Keep the deck's language and tone unless asked otherwise. You may change the layout if the instruction calls for it (e.g. "make it visual").
${DESIGN_RULES}`,
        prompt: `Deck title: ${clean.title}
Whole deck for context (JSON): ${JSON.stringify(clean.slides.map((s) => ({ layout: s.layout, title: s.title })))}
Slide to edit (index ${slideIndex}): ${JSON.stringify(clean.slides[slideIndex])}
${settings}

Instruction: ${instruction}`,
        output: Output.object({ schema: z.object({ slide: slideSchema, message: z.string().describe("One short sentence describing what you changed") }) }),
      });
      return Response.json(output);
    }

    const { output } = await generateText({
      model: getModel(),
    maxRetries: 2,
      instructions: `You are Peti, PePeTi's slide assistant. Apply the user's instruction to the whole deck and return the complete revised deck. Preserve slides the instruction does not affect. You may add, remove or reorder slides when asked.
${DESIGN_RULES}`,
      prompt: `Current deck (JSON): ${JSON.stringify(clean)}
${settings}

Instruction: ${instruction}`,
      output: Output.object({ schema: z.object({ deck: deckSchema, message: z.string().describe("One or two short sentences describing what you changed") }) }),
    });
    return Response.json(output);
  } catch (err) {
    return Response.json({ error: friendlyError(err) }, { status: 500 });
  }
}
