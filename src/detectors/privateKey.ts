import type { Detector, Match } from "./types";

const PRIVATE_KEY_RE =
  /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z ]+ )?PRIVATE KEY-----/g;

export const privateKeyDetector: Detector = {
  id: "privateKey",
  label: "Private key block",
  detect(text) {
    const out: Match[] = [];
    for (const m of text.matchAll(PRIVATE_KEY_RE)) {
      const start = m.index ?? 0;
      out.push({
        detector: "privateKey",
        label: "PRIVATE_KEY",
        start,
        end: start + m[0].length,
        value: m[0],
      });
    }
    return out;
  },
};
