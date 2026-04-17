import { regexDetector } from "./regexHelper";

export const anthropicKeyDetector = regexDetector({
  id: "anthropicKey",
  label: "Anthropic API key",
  matchLabel: "ANTHROPIC_KEY",
  pattern: /\bsk-ant-(?:api|admin)\d{2}-[A-Za-z0-9_-]{20,}\b/g,
});
