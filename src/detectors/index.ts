import type { Detector, Match } from "./types";
import type { Settings } from "../storage";
import { emailDetector } from "./email";
import { creditCardDetector } from "./creditCard";
import { openaiKeyDetector } from "./openaiKey";
import { anthropicKeyDetector } from "./anthropicKey";
import { awsAccessKeyDetector } from "./awsAccessKey";
import { githubTokenDetector } from "./githubToken";
import { googleApiKeyDetector } from "./googleApiKey";
import { stripeKeyDetector } from "./stripeKey";
import { slackTokenDetector } from "./slackToken";
import { jwtDetector } from "./jwt";
import { privateKeyDetector } from "./privateKey";
import { phoneDetector } from "./phone";
import { ssnDetector } from "./ssn";
import { ipv4Detector } from "./ipv4";
import { buildCustomDetector } from "./custom";

export const builtInDetectors: Detector[] = [
  privateKeyDetector,
  emailDetector,
  creditCardDetector,
  anthropicKeyDetector,
  openaiKeyDetector,
  awsAccessKeyDetector,
  githubTokenDetector,
  googleApiKeyDetector,
  stripeKeyDetector,
  slackTokenDetector,
  jwtDetector,
  ssnDetector,
  phoneDetector,
  ipv4Detector,
];

export interface RedactionResult {
  matches: Match[];
  redacted: string;
  mapping: Record<string, string>;
}

function activeDetectors(settings?: Settings): Detector[] {
  if (!settings) return builtInDetectors;
  const enabled = builtInDetectors.filter(
    (d) => settings.detectorEnabled[d.id] !== false,
  );
  const custom = settings.customPatterns
    .map(buildCustomDetector)
    .filter((d): d is Detector => d !== null);
  return [...enabled, ...custom];
}

export function scan(text: string, settings?: Settings): Match[] {
  const list = activeDetectors(settings);
  const all = list.flatMap((d) => d.detect(text));
  all.sort((a, b) => a.start - b.start || b.end - a.end);

  const filtered: Match[] = [];
  let lastEnd = -1;
  for (const m of all) {
    if (m.start >= lastEnd) {
      filtered.push(m);
      lastEnd = m.end;
    }
  }
  return filtered;
}

export function redact(text: string, settings?: Settings): RedactionResult {
  const matches = scan(text, settings);
  const counters: Record<string, number> = {};
  const mapping: Record<string, string> = {};
  let out = "";
  let cursor = 0;
  for (const m of matches) {
    out += text.slice(cursor, m.start);
    counters[m.label] = (counters[m.label] ?? 0) + 1;
    const placeholder = `[${m.label}_${counters[m.label]}]`;
    mapping[placeholder] = m.value;
    out += placeholder;
    cursor = m.end;
  }
  out += text.slice(cursor);
  return { matches, redacted: out, mapping };
}

export type { Match, Detector, DetectorId } from "./types";
