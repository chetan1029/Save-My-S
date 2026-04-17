import type { Detector, DetectorId, Match } from "./types";

export function regexDetector(opts: {
  id: DetectorId;
  label: string;
  pattern: RegExp;
  matchLabel: string;
  validate?: (raw: string) => boolean;
}): Detector {
  return {
    id: opts.id,
    label: opts.label,
    detect(text) {
      const out: Match[] = [];
      for (const m of text.matchAll(opts.pattern)) {
        const raw = m[0];
        if (opts.validate && !opts.validate(raw)) continue;
        const start = m.index ?? 0;
        out.push({
          detector: opts.id,
          label: opts.matchLabel,
          start,
          end: start + raw.length,
          value: raw,
        });
      }
      return out;
    },
  };
}
