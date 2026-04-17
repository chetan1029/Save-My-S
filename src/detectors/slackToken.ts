import { regexDetector } from "./regexHelper";

export const slackTokenDetector = regexDetector({
  id: "slackToken",
  label: "Slack token",
  matchLabel: "SLACK_TOKEN",
  pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
});
