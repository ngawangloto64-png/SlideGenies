export const maxDuration = 60;

const MAX_CHARS = 60000;

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file uploaded." }, { status: 400 });
  if (file.size > 20 * 1024 * 1024) return Response.json({ error: "File is larger than 20 MB." }, { status: 400 });

  const name = file.name.toLowerCase();
  const buf = new Uint8Array(await file.arrayBuffer());
  let text = "";

  try {
    if (name.endsWith(".pdf")) {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(buf);
      const res = await extractText(pdf, { mergePages: true });
      text = Array.isArray(res.text) ? res.text.join("\n") : res.text;
    } else if (name.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const res = await mammoth.extractRawText({ buffer: Buffer.from(buf) });
      text = res.value;
    } else if (/\.(txt|md|markdown|csv|json|html?)$/.test(name)) {
      text = new TextDecoder().decode(buf);
      if (/\.html?$/.test(name)) text = text.replace(/<[^>]+>/g, " ");
    } else {
      return Response.json({ error: "Supported files: PDF, DOCX, TXT, MD, CSV, HTML." }, { status: 400 });
    }
  } catch (err) {
    return Response.json({ error: `Could not read file: ${err instanceof Error ? err.message : "unknown error"}` }, { status: 400 });
  }

  text = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) return Response.json({ error: "No readable text found in that file." }, { status: 400 });
  return Response.json({ text: text.slice(0, MAX_CHARS), truncated: text.length > MAX_CHARS, chars: text.length });
}
