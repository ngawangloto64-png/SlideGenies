import type { ArtKind } from "./art";

export type Deco =
  | "none"
  | "bar"
  | "topband"
  | "corner"
  | "frame"
  | "split"
  | "blobs"
  | "diagonal"
  | "minimal"
  | "dots"
  | "stripes";

export type FontKey =
  | "Arial"
  | "Arial Black"
  | "Georgia"
  | "Trebuchet MS"
  | "Verdana"
  | "Tahoma"
  | "Impact"
  | "Courier New"
  | "Times New Roman"
  | "Century Gothic"
  | "Palatino Linotype"
  | "Garamond";

export const FONT_STACKS: Record<FontKey, string> = {
  Arial: "Arial, Helvetica, sans-serif",
  "Arial Black": '"Arial Black", "Arial Bold", Gadget, sans-serif',
  Georgia: "Georgia, serif",
  "Trebuchet MS": '"Trebuchet MS", "Lucida Grande", sans-serif',
  Verdana: "Verdana, Geneva, sans-serif",
  Tahoma: "Tahoma, Verdana, sans-serif",
  Impact: "Impact, Haettenschweiler, sans-serif",
  "Courier New": '"Courier New", Courier, monospace',
  "Times New Roman": '"Times New Roman", Times, serif',
  "Century Gothic": '"Century Gothic", Futura, "Avenir Next", sans-serif',
  "Palatino Linotype": '"Palatino Linotype", Palatino, "Book Antiqua", serif',
  Garamond: 'Garamond, "EB Garamond", Baskerville, serif',
};

export type Template = {
  id: string;
  name: string;
  category: string;
  /** Hex colors without '#' (pptx format). */
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  /** Text color used on top of the accent color. */
  onAccent: string;
  heading: FontKey;
  body: FontKey;
  deco: Deco;
  /** Procedural background artwork (3D, robotic, scientific…). */
  art?: ArtKind;
  /** Card transparency over artwork, 0 (solid) .. 1 (invisible). */
  glass?: number;
  /** 3D depth: drop shadows on cards and titles. */
  depth?: boolean;
  /** Title / section / closing slides use the accent as background. */
  heroAccent: boolean;
  /** Short tagline shown in the template preview. */
  vibe?: string;
};

export const CATEGORIES = [
  "All",
  "3D",
  "Robotic",
  "Science",
  "Futuristic",
  "Abstract",
  "Business",
  "Minimal",
  "Dark",
  "Creative",
  "Tech",
  "Elegant",
  "Nature",
  "Education",
  "Playful",
] as const;

export const TEMPLATES: Template[] = [
  // 3D
  { id: "iso-city", name: "Iso City", category: "3D", bg: "F3F5FF", surface: "FFFFFF", text: "151A3B", muted: "5B6285", accent: "4F46E5", accent2: "06B6D4", onAccent: "FFFFFF", heading: "Century Gothic", body: "Verdana", deco: "none", heroAccent: false, art: "isometric", glass: 0.1, depth: true },
  { id: "glass-orbs", name: "Glass Orbs", category: "3D", bg: "0B0F2A", surface: "FFFFFF", text: "F4F5FF", muted: "A9AFD6", accent: "7C3AED", accent2: "22D3EE", onAccent: "FFFFFF", heading: "Century Gothic", body: "Verdana", deco: "none", heroAccent: false, art: "orbs", glass: 0.9, depth: true },
  { id: "clay-pop", name: "Clay Pop", category: "3D", bg: "FFF3EC", surface: "FFFFFF", text: "3A2236", muted: "86677E", accent: "FF7A59", accent2: "7C6CF6", onAccent: "FFFFFF", heading: "Trebuchet MS", body: "Verdana", deco: "none", heroAccent: false, art: "clay", glass: 0.08, depth: true },
  { id: "prism", name: "Prism", category: "3D", bg: "0F172A", surface: "FFFFFF", text: "F8FAFC", muted: "A5B1C8", accent: "8B5CF6", accent2: "EC4899", onAccent: "FFFFFF", heading: "Arial Black", body: "Arial", deco: "none", heroAccent: false, art: "lowpoly", glass: 0.9, depth: true },
  { id: "paper-layers", name: "Paper Layers", category: "3D", bg: "FDF8F3", surface: "FFFFFF", text: "2B1B14", muted: "7F6A5E", accent: "F97316", accent2: "DB2777", onAccent: "FFFFFF", heading: "Georgia", body: "Verdana", deco: "none", heroAccent: false, art: "waves", glass: 0.1, depth: true },
  { id: "cyber-city", name: "Cyber City", category: "3D", bg: "0B0B1A", surface: "FFFFFF", text: "F5F3FF", muted: "B0A8D9", accent: "FF2E97", accent2: "7C3AED", onAccent: "FFFFFF", heading: "Arial Black", body: "Verdana", deco: "none", heroAccent: false, art: "isometric", glass: 0.9, depth: true },

  { id: "hyper-tunnel", name: "Hyper Tunnel", category: "3D", vibe: "Infinite neon depth corridor", bg: "05010F", surface: "FFFFFF", text: "F5F0FF", muted: "A99CC9", accent: "00E5FF", accent2: "FF2BD6", onAccent: "05010F", heading: "Verdana", body: "Verdana", deco: "none", heroAccent: false, art: "tunnel", glass: 0.9, depth: true },
  { id: "glass-prism", name: "Glass Prism", category: "3D", vibe: "Refracting glass pyramids", bg: "0F0A1E", surface: "FFFFFF", text: "F5F3FF", muted: "B4A9D6", accent: "22D3EE", accent2: "E879F9", onAccent: "0F0A1E", heading: "Century Gothic", body: "Verdana", deco: "none", heroAccent: false, art: "prism", glass: 0.9, depth: true },
  { id: "wave-surface", name: "Wave Surface", category: "3D", vibe: "Flowing 3D wireframe terrain", bg: "06121F", surface: "FFFFFF", text: "E8F4FF", muted: "8FB0CC", accent: "38BDF8", accent2: "818CF8", onAccent: "06121F", heading: "Century Gothic", body: "Arial", deco: "none", heroAccent: false, art: "waves3d", glass: 0.9, depth: true },

  // Robotic
  { id: "mech-core", name: "Mech Core", category: "Robotic", vibe: "Friendly robot with glowing optics", bg: "0B1220", surface: "FFFFFF", text: "EAF2FF", muted: "8EA0BD", accent: "38BDF8", accent2: "F59E0B", onAccent: "0B1220", heading: "Verdana", body: "Verdana", deco: "none", heroAccent: false, art: "robot", glass: 0.9, depth: true },
  { id: "robo-white", name: "Robo White", category: "Robotic", vibe: "Clean lab robotics, white and steel", bg: "F2F5F9", surface: "FFFFFF", text: "111827", muted: "5B6577", accent: "2563EB", accent2: "F43F5E", onAccent: "FFFFFF", heading: "Century Gothic", body: "Arial", deco: "none", heroAccent: false, art: "robot", glass: 0.1, depth: true },
  { id: "code-rain", name: "Code Rain", category: "Robotic", vibe: "Falling glyphs on a dark terminal", bg: "000A02", surface: "FFFFFF", text: "D8FFE3", muted: "73B488", accent: "00FF66", accent2: "9BFFB0", onAccent: "000A02", heading: "Courier New", body: "Courier New", deco: "none", heroAccent: false, art: "matrix", glass: 0.92, depth: false },
  { id: "circuit", name: "Circuit", category: "Robotic", bg: "03140F", surface: "FFFFFF", text: "E8FFF6", muted: "8CC7B2", accent: "10F5A0", accent2: "00B3FF", onAccent: "03140F", heading: "Courier New", body: "Verdana", deco: "none", heroAccent: false, art: "circuit", glass: 0.92, depth: true },
  { id: "mecha-hud", name: "Mecha HUD", category: "Robotic", bg: "070B14", surface: "FFFFFF", text: "E6FBFF", muted: "86A6B8", accent: "00E5FF", accent2: "FF3D71", onAccent: "070B14", heading: "Arial Black", body: "Verdana", deco: "none", heroAccent: false, art: "hud", glass: 0.92, depth: true },
  { id: "cyber-lattice", name: "Cyber Lattice", category: "Robotic", bg: "0E1116", surface: "FFFFFF", text: "F1FFE0", muted: "9AAA8E", accent: "A3FF12", accent2: "00E1FF", onAccent: "0E1116", heading: "Impact", body: "Verdana", deco: "none", heroAccent: false, art: "hexgrid", glass: 0.92, depth: true },
  { id: "neural-core", name: "Neural Core", category: "Robotic", bg: "0A0A1F", surface: "FFFFFF", text: "F1F0FF", muted: "A3A1C9", accent: "8B5CF6", accent2: "22D3EE", onAccent: "FFFFFF", heading: "Century Gothic", body: "Arial", deco: "none", heroAccent: false, art: "neural", glass: 0.9, depth: true },

  // Science
  { id: "molecular", name: "Molecular", category: "Science", bg: "0B1324", surface: "FFFFFF", text: "EEF6FF", muted: "93A6C4", accent: "38BDF8", accent2: "F472B6", onAccent: "0B1324", heading: "Century Gothic", body: "Verdana", deco: "none", heroAccent: false, art: "molecule", glass: 0.9, depth: true },
  { id: "helix", name: "Helix", category: "Science", bg: "F4FBF8", surface: "FFFFFF", text: "0F2A22", muted: "557468", accent: "10B981", accent2: "6366F1", onAccent: "FFFFFF", heading: "Trebuchet MS", body: "Verdana", deco: "none", heroAccent: false, art: "dna", glass: 0.08, depth: true },
  { id: "quantum", name: "Quantum", category: "Science", bg: "05060F", surface: "FFFFFF", text: "EEF2FF", muted: "9CA3C9", accent: "60A5FA", accent2: "C084FC", onAccent: "05060F", heading: "Palatino Linotype", body: "Verdana", deco: "none", heroAccent: false, art: "orbitals", glass: 0.92, depth: true },
  { id: "blueprint", name: "Blueprint", category: "Science", bg: "0B3D91", surface: "FFFFFF", text: "FFFFFF", muted: "C5D6F5", accent: "FFD166", accent2: "7FDBFF", onAccent: "0B3D91", heading: "Courier New", body: "Verdana", deco: "none", heroAccent: false, art: "blueprint", glass: 0.9, depth: false },
  { id: "lab-notes", name: "Lab Notes", category: "Science", bg: "FFFFFF", surface: "FFFFFF", text: "111827", muted: "5B6472", accent: "2563EB", accent2: "DC2626", onAccent: "FFFFFF", heading: "Georgia", body: "Verdana", deco: "none", heroAccent: false, art: "labdata", glass: 0.12, depth: true },
  { id: "cosmos", name: "Cosmos", category: "Science", bg: "05030F", surface: "FFFFFF", text: "F7F2FF", muted: "B4A9D1", accent: "9333EA", accent2: "F59E0B", onAccent: "FFFFFF", heading: "Century Gothic", body: "Verdana", deco: "none", heroAccent: false, art: "cosmos", glass: 0.9, depth: true },
  { id: "globe", name: "Global Grid", category: "Science", bg: "020617", surface: "FFFFFF", text: "E0F2FE", muted: "8FA6C2", accent: "38BDF8", accent2: "A78BFA", onAccent: "020617", heading: "Verdana", body: "Verdana", deco: "none", heroAccent: false, art: "globe", glass: 0.92, depth: true },
  { id: "microscope", name: "Microscope", category: "Science", vibe: "Living cells under the lens", bg: "F3FBF7", surface: "FFFFFF", text: "0F2E22", muted: "5A7D6F", accent: "10B981", accent2: "F59E0B", onAccent: "FFFFFF", heading: "Trebuchet MS", body: "Verdana", deco: "none", heroAccent: false, art: "cells", glass: 0.1, depth: true },
  { id: "double-helix", name: "Double Helix", category: "Science", vibe: "Glowing 3D DNA strand", bg: "07111F", surface: "FFFFFF", text: "EAF6FF", muted: "8FAAC4", accent: "22D3EE", accent2: "F472B6", onAccent: "07111F", heading: "Century Gothic", body: "Arial", deco: "none", heroAccent: false, art: "dna", glass: 0.9, depth: true },

  // Futuristic
  { id: "mars", name: "Mars Mission", category: "Futuristic", vibe: "Red-planet expedition", bg: "140806", surface: "FFFFFF", text: "FFF1EA", muted: "C9A291", accent: "F97316", accent2: "FCD34D", onAccent: "140806", heading: "Impact", body: "Verdana", deco: "none", heroAccent: false, art: "cosmos", glass: 0.9, depth: true },
  { id: "synthwave", name: "Synthwave", category: "Futuristic", bg: "14002E", surface: "FFFFFF", text: "FFF0FB", muted: "C7A6D9", accent: "FF2E97", accent2: "00F0FF", onAccent: "FFFFFF", heading: "Impact", body: "Verdana", deco: "none", heroAccent: false, art: "synthwave", glass: 0.9, depth: true },
  { id: "aurora-glass", name: "Aurora Glass", category: "Futuristic", bg: "0B1026", surface: "FFFFFF", text: "F5F7FF", muted: "A8B0D4", accent: "7C3AED", accent2: "06B6D4", onAccent: "FFFFFF", heading: "Century Gothic", body: "Verdana", deco: "none", heroAccent: false, art: "aurora", glass: 0.88, depth: true },
  { id: "holo-light", name: "Holo Light", category: "Futuristic", bg: "F7F7FF", surface: "FFFFFF", text: "1B1B3A", muted: "64648C", accent: "A78BFA", accent2: "38BDF8", onAccent: "FFFFFF", heading: "Century Gothic", body: "Verdana", deco: "none", heroAccent: false, art: "aurora", glass: 0.35, depth: true },

  // Abstract
  { id: "contour", name: "Contour", category: "Abstract", bg: "F8F5EE", surface: "FFFFFF", text: "1E2A24", muted: "667168", accent: "1F6F5C", accent2: "C2410C", onAccent: "FFFFFF", heading: "Georgia", body: "Verdana", deco: "none", heroAccent: false, art: "topo", glass: 0.1, depth: true },
  { id: "topo-night", name: "Topo Night", category: "Abstract", bg: "0B1220", surface: "FFFFFF", text: "E6F6FF", muted: "93A4BD", accent: "22D3EE", accent2: "818CF8", onAccent: "0B1220", heading: "Trebuchet MS", body: "Verdana", deco: "none", heroAccent: false, art: "topo", glass: 0.92, depth: true },
  { id: "shards", name: "Shards", category: "Abstract", bg: "FFFFFF", surface: "FFFFFF", text: "111827", muted: "5B6472", accent: "2563EB", accent2: "9333EA", onAccent: "FFFFFF", heading: "Arial Black", body: "Arial", deco: "none", heroAccent: false, art: "lowpoly", glass: 0.1, depth: true },

  // Business
  { id: "corporate-blue", name: "Corporate Blue", category: "Business", bg: "FFFFFF", surface: "F1F5FB", text: "1B2A41", muted: "5B6B82", accent: "1E5EFF", accent2: "00B3FF", onAccent: "FFFFFF", heading: "Arial", body: "Arial", deco: "bar", heroAccent: true },
  { id: "boardroom", name: "Boardroom", category: "Business", bg: "F7F7F5", surface: "FFFFFF", text: "1F2328", muted: "6A6F76", accent: "0B3D2E", accent2: "C9A227", onAccent: "FFFFFF", heading: "Georgia", body: "Arial", deco: "topband", heroAccent: true },
  { id: "consulting", name: "Consulting", category: "Business", bg: "FFFFFF", surface: "F3F4F6", text: "111827", muted: "6B7280", accent: "0F766E", accent2: "14B8A6", onAccent: "FFFFFF", heading: "Trebuchet MS", body: "Arial", deco: "split", heroAccent: false },
  { id: "finance", name: "Finance", category: "Business", bg: "FFFFFF", surface: "EEF2F7", text: "0A1F44", muted: "50607A", accent: "0A1F44", accent2: "2E8B57", onAccent: "FFFFFF", heading: "Tahoma", body: "Tahoma", deco: "stripes", heroAccent: true },
  { id: "pitch-red", name: "Pitch Red", category: "Business", bg: "FFFFFF", surface: "FDF1F1", text: "1A1A1A", muted: "666666", accent: "E63946", accent2: "1D3557", onAccent: "FFFFFF", heading: "Arial Black", body: "Arial", deco: "diagonal", heroAccent: true },

  // Minimal
  { id: "paper", name: "Paper", category: "Minimal", bg: "FFFFFF", surface: "F5F5F5", text: "111111", muted: "777777", accent: "111111", accent2: "999999", onAccent: "FFFFFF", heading: "Arial", body: "Arial", deco: "minimal", heroAccent: false },
  { id: "swiss", name: "Swiss", category: "Minimal", bg: "FFFFFF", surface: "F2F2F2", text: "000000", muted: "555555", accent: "FF2D20", accent2: "000000", onAccent: "FFFFFF", heading: "Arial Black", body: "Arial", deco: "bar", heroAccent: false },
  { id: "mono-frame", name: "Mono Frame", category: "Minimal", bg: "FAFAF7", surface: "FFFFFF", text: "222222", muted: "707070", accent: "222222", accent2: "B0B0B0", onAccent: "FAFAF7", heading: "Century Gothic", body: "Century Gothic", deco: "frame", heroAccent: false },
  { id: "sand", name: "Sand", category: "Minimal", bg: "F4EFE6", surface: "FBF8F3", text: "3B3024", muted: "7D6E5C", accent: "B5835A", accent2: "D9C3A5", onAccent: "FFFFFF", heading: "Georgia", body: "Verdana", deco: "minimal", heroAccent: false },

  // Dark
  { id: "midnight", name: "Midnight", category: "Dark", bg: "0B1020", surface: "161D33", text: "F2F4FA", muted: "9AA3BD", accent: "7C5CFF", accent2: "00D1FF", onAccent: "FFFFFF", heading: "Century Gothic", body: "Arial", deco: "blobs", heroAccent: false },
  { id: "carbon", name: "Carbon", category: "Dark", bg: "121212", surface: "1E1E1E", text: "EDEDED", muted: "A0A0A0", accent: "F5C518", accent2: "FF6B35", onAccent: "121212", heading: "Impact", body: "Arial", deco: "stripes", heroAccent: false },
  { id: "noir-gold", name: "Noir Gold", category: "Dark", bg: "0E0E10", surface: "1A1A1D", text: "F5F0E6", muted: "A89F8F", accent: "D4AF37", accent2: "8C7A3E", onAccent: "0E0E10", heading: "Garamond", body: "Georgia", deco: "frame", heroAccent: false },
  { id: "deep-ocean", name: "Deep Ocean", category: "Dark", bg: "04293A", surface: "064663", text: "ECF8F9", muted: "9CC5D0", accent: "ECB365", accent2: "3FA7D6", onAccent: "04293A", heading: "Trebuchet MS", body: "Trebuchet MS", deco: "corner", heroAccent: false },
  { id: "neon-night", name: "Neon Night", category: "Dark", bg: "0D0221", surface: "1B0A3C", text: "F7F7FF", muted: "B3A9D6", accent: "FF2E88", accent2: "00F5D4", onAccent: "FFFFFF", heading: "Arial Black", body: "Verdana", deco: "diagonal", heroAccent: false },

  // Creative
  { id: "sunset", name: "Sunset", category: "Creative", bg: "FFF8F0", surface: "FFFFFF", text: "2D1E2F", muted: "7A6670", accent: "FF6B6B", accent2: "FFB347", onAccent: "FFFFFF", heading: "Trebuchet MS", body: "Verdana", deco: "blobs", heroAccent: true },
  { id: "bauhaus", name: "Bauhaus", category: "Creative", bg: "F2EBDD", surface: "FFFFFF", text: "1C1C1C", muted: "5C5C5C", accent: "D62828", accent2: "003049", onAccent: "FFFFFF", heading: "Century Gothic", body: "Century Gothic", deco: "corner", heroAccent: false },
  { id: "magazine", name: "Magazine", category: "Creative", bg: "FFFFFF", surface: "F7F3EE", text: "151515", muted: "6B6B6B", accent: "FF4F00", accent2: "151515", onAccent: "FFFFFF", heading: "Times New Roman", body: "Georgia", deco: "split", heroAccent: true },
  { id: "pop-art", name: "Pop Art", category: "Creative", bg: "FFE74C", surface: "FFFFFF", text: "1A1A1A", muted: "3D3D3D", accent: "FF5964", accent2: "35A7FF", onAccent: "FFFFFF", heading: "Impact", body: "Arial", deco: "dots", heroAccent: true },

  // Tech
  { id: "terminal", name: "Terminal", category: "Tech", bg: "0C0F0A", surface: "141A12", text: "D7FFD0", muted: "7FA878", accent: "39FF14", accent2: "00C2A8", onAccent: "0C0F0A", heading: "Courier New", body: "Courier New", deco: "frame", heroAccent: false },
  { id: "startup", name: "Startup", category: "Tech", bg: "FFFFFF", surface: "F4F2FF", text: "14112B", muted: "625D80", accent: "6C47FF", accent2: "FF7AC6", onAccent: "FFFFFF", heading: "Century Gothic", body: "Arial", deco: "blobs", heroAccent: true },
  { id: "cyber", name: "Cyber Grid", category: "Tech", bg: "0A0F1F", surface: "121A33", text: "E6F1FF", muted: "8DA2C7", accent: "00E5FF", accent2: "FF00A8", onAccent: "0A0F1F", heading: "Verdana", body: "Verdana", deco: "dots", heroAccent: false },
  { id: "cloud", name: "Cloud", category: "Tech", bg: "F5F9FF", surface: "FFFFFF", text: "102A43", muted: "627D98", accent: "2680C2", accent2: "47A3F3", onAccent: "FFFFFF", heading: "Tahoma", body: "Tahoma", deco: "corner", heroAccent: true },

  // Elegant
  { id: "ivory", name: "Ivory", category: "Elegant", bg: "FBF8F1", surface: "FFFFFF", text: "2B2B2B", muted: "7B7468", accent: "8C6A3F", accent2: "C8B38A", onAccent: "FFFFFF", heading: "Garamond", body: "Georgia", deco: "frame", heroAccent: false },
  { id: "royal", name: "Royal", category: "Elegant", bg: "FFFFFF", surface: "F5F2FA", text: "1E1433", muted: "6B6280", accent: "3C1874", accent2: "D4AF37", onAccent: "FFFFFF", heading: "Palatino Linotype", body: "Georgia", deco: "topband", heroAccent: true },
  { id: "blush", name: "Blush", category: "Elegant", bg: "FFF5F5", surface: "FFFFFF", text: "3A2A2E", muted: "8A7378", accent: "C06C84", accent2: "F8B195", onAccent: "FFFFFF", heading: "Palatino Linotype", body: "Verdana", deco: "corner", heroAccent: false },

  // Nature
  { id: "forest", name: "Forest", category: "Nature", bg: "F3F7F0", surface: "FFFFFF", text: "1F3326", muted: "5E7464", accent: "2D6A4F", accent2: "95D5B2", onAccent: "FFFFFF", heading: "Georgia", body: "Trebuchet MS", deco: "blobs", heroAccent: true },
  { id: "ocean-breeze", name: "Ocean Breeze", category: "Nature", bg: "F0FAFB", surface: "FFFFFF", text: "113B44", muted: "4E7A82", accent: "0096C7", accent2: "48CAE4", onAccent: "FFFFFF", heading: "Trebuchet MS", body: "Verdana", deco: "stripes", heroAccent: true },
  { id: "terracotta", name: "Terracotta", category: "Nature", bg: "FAF1E8", surface: "FFF9F3", text: "3D2418", muted: "86604C", accent: "C65D3B", accent2: "E9A178", onAccent: "FFFFFF", heading: "Century Gothic", body: "Georgia", deco: "split", heroAccent: true },

  // Education
  { id: "chalkboard", name: "Chalkboard", category: "Education", bg: "2B3A33", surface: "34463D", text: "F3F1E7", muted: "BFC8B8", accent: "F2D16B", accent2: "8FD3C1", onAccent: "2B3A33", heading: "Trebuchet MS", body: "Trebuchet MS", deco: "frame", heroAccent: false },
  { id: "notebook", name: "Notebook", category: "Education", bg: "FFFEF7", surface: "FFFFFF", text: "1F2937", muted: "6B7280", accent: "2563EB", accent2: "EF4444", onAccent: "FFFFFF", heading: "Verdana", body: "Verdana", deco: "bar", heroAccent: false },
  { id: "academic", name: "Academic", category: "Education", bg: "FFFFFF", surface: "F4F1EA", text: "1D1D1F", muted: "66615A", accent: "7A0019", accent2: "C5A572", onAccent: "FFFFFF", heading: "Times New Roman", body: "Georgia", deco: "topband", heroAccent: true },

  // Playful
  { id: "candy", name: "Candy", category: "Playful", bg: "FFF0F6", surface: "FFFFFF", text: "3B1F4A", muted: "7E6690", accent: "FF4FA3", accent2: "7B61FF", onAccent: "FFFFFF", heading: "Trebuchet MS", body: "Verdana", deco: "dots", heroAccent: true },
  { id: "lemonade", name: "Lemonade", category: "Playful", bg: "FFFBE6", surface: "FFFFFF", text: "2E2A12", muted: "6E6840", accent: "FFB800", accent2: "38B000", onAccent: "2E2A12", heading: "Arial Black", body: "Verdana", deco: "blobs", heroAccent: true },
  { id: "retro", name: "Retro", category: "Playful", bg: "F6E7CB", surface: "FFF6E5", text: "2F1B12", muted: "7A5A44", accent: "E76F51", accent2: "2A9D8F", onAccent: "FFFFFF", heading: "Impact", body: "Trebuchet MS", deco: "stripes", heroAccent: true },
];

/** Renamed template ids, so older saved decks keep their look. */
const RENAMED: Record<string, string> = { matrix: "code-rain", android: "cyber-lattice", "android-white": "robo-white" };

export function getTemplate(id: string): Template {
  const key = RENAMED[id] ?? id;
  return TEMPLATES.find((t) => t.id === key) ?? TEMPLATES[0];
}

/** Brand Vault: the user's logo, colors and fonts layered on top of any template. */
export type Brand = {
  enabled: boolean;
  accent?: string;
  accent2?: string;
  heading?: FontKey;
  body?: FontKey;
  logo?: { src: string; w: number; h: number };
  /** "Art Blend": artwork applied on top of any theme ("none" removes it). Works even when the kit is off. */
  art?: ArtKind | "none";
};

export type ThemedTemplate = Template & { logo?: Brand["logo"] };

/** Pick black or white text for a given background color. */
export function readableOn(hex: string) {
  const n = parseInt(hex, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "111111" : "FFFFFF";
}

function withArt(t: Template, art?: Brand["art"]): Template {
  if (!art) return t;
  if (art === "none") return { ...t, art: undefined };
  const dark = parseInt(t.bg.slice(0, 2), 16) * 0.299 + parseInt(t.bg.slice(2, 4), 16) * 0.587 + parseInt(t.bg.slice(4, 6), 16) * 0.114 < 128;
  return { ...t, art, glass: t.art ? t.glass : dark ? 0.85 : 0.15, depth: true };
}

export function applyBrand(base: Template, brand?: Brand): ThemedTemplate {
  const t = withArt(base, brand?.art);
  if (!brand?.enabled) return t;
  const accent = brand.accent ?? t.accent;
  return {
    ...t,
    accent,
    accent2: brand.accent2 ?? t.accent2,
    onAccent: brand.accent ? readableOn(accent) : t.onAccent,
    heading: brand.heading ?? t.heading,
    body: brand.body ?? t.body,
    logo: brand.logo,
  };
}
