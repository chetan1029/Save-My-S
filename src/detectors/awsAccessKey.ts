import { regexDetector } from "./regexHelper";

export const awsAccessKeyDetector = regexDetector({
  id: "awsAccessKey",
  label: "AWS access key",
  matchLabel: "AWS_KEY",
  pattern: /\b(?:AKIA|ASIA|AROA|AIDA)[A-Z0-9]{16}\b/g,
});
