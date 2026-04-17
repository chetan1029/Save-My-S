import { regexDetector } from "./regexHelper";

export const googleApiKeyDetector = regexDetector({
  id: "googleApiKey",
  label: "Google API key",
  matchLabel: "GOOGLE_API_KEY",
  pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
});
