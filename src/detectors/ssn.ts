import { regexDetector } from "./regexHelper";

export const ssnDetector = regexDetector({
  id: "ssn",
  label: "US SSN",
  matchLabel: "SSN",
  pattern: /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g,
});
