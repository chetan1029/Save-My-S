import { regexDetector } from "./regexHelper";

export const githubTokenDetector = regexDetector({
  id: "githubToken",
  label: "GitHub token",
  matchLabel: "GITHUB_TOKEN",
  pattern: /\bgh[oprsu]_[A-Za-z0-9]{36,}\b/g,
});
