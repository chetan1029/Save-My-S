import { regexDetector } from "./regexHelper";

export const jwtDetector = regexDetector({
  id: "jwt",
  label: "JWT",
  matchLabel: "JWT",
  pattern: /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{8,}\b/g,
});
