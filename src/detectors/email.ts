import type { Detector, Match } from "./types";

const EMAIL_RE =
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

export const emailDetector: Detector = {
  id: "email",
  label: "Email",
  detect(text) {
    const out: Match[] = [];
    for (const m of text.matchAll(EMAIL_RE)) {
      const start = m.index ?? 0;
      out.push({
        detector: "email",
        label: "EMAIL",
        start,
        end: start + m[0].length,
        value: m[0],
      });
    }
    return out;
  },
};
