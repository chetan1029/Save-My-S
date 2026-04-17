import type { Detector, Match } from "./types";
import { luhnValid } from "./luhn";

const CC_RE = /\b(?:\d[ -]?){12,18}\d\b/g;

export const creditCardDetector: Detector = {
  id: "creditCard",
  label: "Credit card",
  detect(text) {
    const out: Match[] = [];
    for (const m of text.matchAll(CC_RE)) {
      const raw = m[0];
      const digits = raw.replace(/[ -]/g, "");
      if (digits.length < 13 || digits.length > 19) continue;
      if (!luhnValid(digits)) continue;
      const start = m.index ?? 0;
      out.push({
        detector: "creditCard",
        label: "CREDIT_CARD",
        start,
        end: start + raw.length,
        value: raw,
      });
    }
    return out;
  },
};
