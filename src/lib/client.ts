"use client";

import type { Deck, GenOptions, ImageData, Outline, Source } from "./schema";
import type { Brand } from "./templates";

/* ───────────────────────── Deck library (localStorage) ───────────────────────── */

export type DeckRecord = {
  id: string;
  deck: Deck;
  templateId: string;
  brand?: Brand;
  options?: GenOptions;
  source?: Source;
  createdAt: number;
  updatedAt: number;
  /** Set when the deck still has to be generated from an approved outline. */
  pending?: { outline: Outline };
};

const KEY = "pepeti:decks";
const LEGACY_KEYS = ["slidegenie:decks", "folio:decks"];

function readAll(): Record<string, DeckRecord> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? LEGACY_KEYS.map((k) => localStorage.getItem(k)).find(Boolean) ?? "{}");
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, DeckRecord>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
    return true;
  } catch {
    return false; // quota exceeded (large images) — caller can warn
  }
}

export const library = {
  list(): DeckRecord[] {
    return Object.values(readAll()).sort((a, b) => b.updatedAt - a.updatedAt);
  },
  get(id: string): DeckRecord | undefined {
    return readAll()[id];
  },
  save(rec: DeckRecord) {
    const all = readAll();
    all[rec.id] = { ...rec, updatedAt: Date.now() };
    return writeAll(all);
  },
  remove(id: string) {
    const all = readAll();
    delete all[id];
    writeAll(all);
  },
};

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

/* ───────────────────────── NDJSON streaming ───────────────────────── */

export type StreamMsg<T> = { type: "partial" | "done"; data: T; demo?: boolean } | { type: "error"; error: string };

export async function streamJson<T>(url: string, body: unknown, onMsg: (m: StreamMsg<T>) => void, signal?: AbortSignal) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
  if (!res.ok || !res.body) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? `Request failed (${res.status})`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n");
    buf = parts.pop() ?? "";
    for (const p of parts) {
      if (!p.trim()) continue;
      const msg = JSON.parse(p) as StreamMsg<T>;
      if (msg.type === "error") throw new Error(msg.error);
      onMsg(msg);
    }
  }
}

/* ───────────────────────── Images ───────────────────────── */

/** Read an image file, downscale it and return a compact data URL with its size. */
export function loadImage(file: File, max = 1600): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      // Keep transparency for PNG logos; JPEG for photos.
      const png = file.type === "image/png" || file.type === "image/svg+xml";
      resolve({ src: canvas.toDataURL(png ? "image/png" : "image/jpeg", 0.85), w, h });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = url;
  });
}

/* ───────────────────────── Share links ───────────────────────── */

type SharePayload = { deck: Deck; templateId: string; brand?: Brand };

async function pipe(data: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Blob([data as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

function toB64Url(bytes: Uint8Array) {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(str: string) {
  const s = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

/** Encode a deck into a self-contained, read-only link (images are left out to keep links short). */
export async function encodeShare(p: SharePayload) {
  const slim: SharePayload = {
    ...p,
    deck: { ...p.deck, slides: p.deck.slides.map((s) => ({ ...s, image: undefined })) },
    brand: p.brand ? { ...p.brand, logo: undefined } : undefined,
  };
  const bytes = await pipe(new TextEncoder().encode(JSON.stringify(slim)), new CompressionStream("deflate-raw"));
  return toB64Url(bytes);
}

export async function decodeShare(hash: string): Promise<SharePayload> {
  const bytes = await pipe(fromB64Url(hash), new DecompressionStream("deflate-raw"));
  return JSON.parse(new TextDecoder().decode(bytes));
}
