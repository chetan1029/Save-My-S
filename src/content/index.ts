import { redact, scan } from "../detectors";
import {
  attachAdapter,
  type SiteAdapter,
  type SubmitDecision,
} from "../adapters/base";
import { chatgptAdapter } from "../adapters/chatgpt";
import { claudeAdapter } from "../adapters/claude";
import { geminiAdapter } from "../adapters/gemini";
import { genericAdapter } from "../adapters/generic";
import { showConfirmModal } from "./modal";
import { updateIndicator, hideIndicator } from "./inlineIndicator";
import {
  getSettings,
  isHostAllowlisted,
  onSettingsChanged,
  recordDetections,
  type Settings,
} from "../storage";

const adapters: SiteAdapter[] = [
  chatgptAdapter,
  claudeAdapter,
  geminiAdapter,
  genericAdapter,
];

function pickAdapter(): SiteAdapter | null {
  const host = location.hostname;
  return adapters.find((a) => a.matches(host)) ?? null;
}

let currentSettings: Settings | null = null;

function active(s: Settings | null): boolean {
  if (!s) return false;
  if (!s.enabled) return false;
  if (isHostAllowlisted(location.hostname, s.domainAllowlist)) return false;
  return true;
}

async function init() {
  const adapter = pickAdapter();
  if (!adapter) return;

  currentSettings = await getSettings();
  onSettingsChanged((s) => {
    currentSettings = s;
    if (!active(s)) hideIndicator();
  });

  attachAdapter(adapter, {
    onSubmit: async (text): Promise<SubmitDecision> => {
      if (!active(currentSettings)) return { kind: "send-original" };
      const result = redact(text, currentSettings ?? undefined);
      if (result.matches.length === 0) return { kind: "send-original" };
      const decision = await showConfirmModal(
        text,
        result.redacted,
        result.matches,
        "send",
      );
      if (decision.kind !== "cancel") {
        void recordDetections(result.matches.map((m) => m.label));
      }
      return decision;
    },
    onPaste: async (pasted): Promise<SubmitDecision> => {
      if (!active(currentSettings)) return { kind: "send-original" };
      const result = redact(pasted, currentSettings ?? undefined);
      if (result.matches.length === 0) return { kind: "send-original" };
      const decision = await showConfirmModal(
        pasted,
        result.redacted,
        result.matches,
        "paste",
      );
      if (decision.kind !== "cancel") {
        void recordDetections(result.matches.map((m) => m.label));
      }
      return decision;
    },
    onInput: (text, input) => {
      if (!active(currentSettings)) {
        hideIndicator();
        return;
      }
      const matches = scan(text, currentSettings ?? undefined);
      updateIndicator(matches, input);
    },
  });
}

void init();
