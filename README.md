# SlideGenie — Ideas to Slides, Instantly

Describe it, paste it or upload it → shape the **Story map** → get a designed deck → refine it with **Genie** → present or download.

## What it does

- **Three ways in** — describe your topic, paste notes, or upload a PDF / DOCX / TXT / MD file.
- **Story map** — review the narrative card by card (drag, rename, change layouts) before anything is designed.
- **Genie** — wish for changes in plain words, for one slide or the whole deck. One-tap **Reword · Tighten · Elaborate · Visualize** on each slide.
- **66 themes** — classic styles plus illustrated **3D, Robotic, Science, Futuristic and Abstract** themes, each with a full **preview** before you use it.
- **Brand Vault & Art Blend** — keep your logo, colors and fonts, and blend any SlideGenie artwork into any theme.
- **New arrangement** — cycle alternate arrangements of a slide; text auto-fits.
- **Real charts** — bar, line, pie and doughnut charts that stay editable after download.
- **Fly-through presenting** — a winding canvas that glides from slide to slide, plus classic full-screen mode and speaker notes.
- **Library & share links** — decks autosave in your browser; share a read-only link.
- **Downloads** — editable `.pptx` (opens in PowerPoint, Keynote and Google Slides) and PDF.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

### Free AI (no credit card)

**Option A — Local AI with Ollama (100% free, private, offline)**

```bash
brew install ollama
brew services start ollama
ollama pull qwen2.5:7b        # ~4.7 GB, one-time
```

`.env.local`:

```
AI_PROVIDER=ollama
OLLAMA_MODEL=qwen2.5:7b
```

Bigger machines can use a stronger model, e.g. `OLLAMA_MODEL=qwen2.5:14b`.

**Option B — Google Gemini free tier (no card)**
Create a free key at https://aistudio.google.com/apikey, then in `.env.local`:

```
AI_PROVIDER=google
GOOGLE_GENERATIVE_AI_API_KEY=your-key
```

**Option C — Vercel AI Gateway (paid, needs a card):** `AI_PROVIDER=gateway` + `AI_GATEWAY_API_KEY`.

Restart `npm run dev` after editing `.env.local`. With no AI configured, the app runs in **demo mode** with sample content.

## Architecture

| Path | Purpose |
| --- | --- |
| `src/app/page.tsx` | Wish (describe / paste / upload) → Story map, library, theme gallery |
| `src/app/deck/[id]/page.tsx` | Studio: filmstrip, canvas, Genie actions, Content / Design / Genie panels, export, present |
| `src/app/view/page.tsx` | Read-only viewer for share links |
| `src/app/api/outline` · `generate` · `revise` · `extract` | Story map, deck generation, Genie edits, document text extraction |
| `src/lib/layout.ts` | Layout engine: slide + theme → positioned shapes, text, images, charts |
| `src/lib/art.ts` | Procedural SVG artwork for illustrated themes |
| `src/components/SlideCanvas.tsx` / `src/lib/exportPptx.ts` | The same layout rendered on screen and into the .pptx |
| `src/lib/templates.ts` | All themes + Brand Vault overrides |
