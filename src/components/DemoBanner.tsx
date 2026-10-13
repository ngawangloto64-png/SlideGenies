export function DemoBanner() {
  return (
    <div className="border-b-[1.5px] border-ink bg-lime px-4 py-2 text-center text-sm">
      <b>Demo mode</b> — no AI connected yet, so content is sample text. Connect a free AI (local Ollama or Google Gemini) in <code className="font-mono">.env.local</code> — see README.
    </div>
  );
}
