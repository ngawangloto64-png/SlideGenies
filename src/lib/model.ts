import type { LanguageModel } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Which AI powers SlideGenie. Free options first:
 *  - "ollama":  a model running locally on this computer — free, private, no account.
 *  - "google":  Google Gemini free tier — needs a free key from aistudio.google.com (no card).
 *  - "gateway": Vercel AI Gateway — paid (requires a card on file).
 * Pick with AI_PROVIDER, or let it auto-detect from the keys that are set.
 */
export type Provider = "ollama" | "google" | "gateway";

export function provider(): Provider | null {
  const p = process.env.AI_PROVIDER?.toLowerCase();
  if (p === "ollama" || p === "google" || p === "gateway") return p;
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) return "google";
  if (process.env.OLLAMA_MODEL) return "ollama";
  if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN) return "gateway";
  return null;
}

export function hasAI() {
  return provider() !== null;
}

export function getModel(): LanguageModel {
  switch (provider()) {
    case "ollama": {
      const ollama = createOpenAICompatible({
        name: "ollama",
        baseURL: `${process.env.OLLAMA_URL ?? "http://localhost:11434"}/v1`,
        supportsStructuredOutputs: true,
      });
      return ollama(process.env.OLLAMA_MODEL ?? "qwen2.5:7b");
    }
    case "google":
      return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })(process.env.GOOGLE_MODEL ?? "gemini-flash-lite-latest");
    default:
      return process.env.AI_MODEL ?? "anthropic/claude-sonnet-5.5";
  }
}

/** Local models are slower; give them a smaller job per request. */
export function isLocal() {
  return provider() === "ollama";
}
