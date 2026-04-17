import { regexDetector } from "./regexHelper";

export const ipv4Detector = regexDetector({
  id: "ipv4",
  label: "IPv4 address",
  matchLabel: "IPV4",
  pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  validate(raw) {
    const parts = raw.split(".").map(Number);
    if (parts.some((n) => n < 0 || n > 255)) return false;
    if (parts[0] === 0) return false;
    if (parts.every((n) => n === 0)) return false;
    return true;
  },
});
