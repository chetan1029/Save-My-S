import type { Detector, Match } from "./types";

const OPENAI_RE = /\bsk-(?!ant-)(?:proj-)?[A-Za-z0-9_-]{20,}\b/g;

export const openaiKeyDetector: Detector = {
  id: "openaiKey",
  label: "OpenAI API key",
  detect(text) {
    const out: Match[] = [];
    for (const m of text.matchAll(OPENAI_RE)) {
      const start = m.index ?? 0;
      out.push({
        detector: "openaiKey",
        label: "OPENAI_KEY",
        start,
        end: start + m[0].length,
        value: m[0],
      });
    }
    return out;
  },
};
