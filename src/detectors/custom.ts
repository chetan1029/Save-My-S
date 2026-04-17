import type { Detector, Match } from "./types";
import type { CustomPattern } from "../storage";

export function buildCustomDetector(p: CustomPattern): Detector | null {
  let re: RegExp;
  try {
    const flags = p.flags.includes("g") ? p.flags : `${p.flags}g`;
    re = new RegExp(p.pattern, flags);
  } catch {
    return null;
  }
  const label = (p.label || "CUSTOM").toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  return {
    id: "custom" as never,
    label: p.label || "Custom",
    detect(text: string): Match[] {
      const out: Match[] = [];
      for (const m of text.matchAll(re)) {
        const start = m.index ?? 0;
        out.push({
          detector: "custom" as never,
          label,
          start,
          end: start + m[0].length,
          value: m[0],
        });
      }
      return out;
    },
  };
}
