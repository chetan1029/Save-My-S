import { regexDetector } from "./regexHelper";

const PHONE_RE =
  /(?<!\d)(?<!\d[\s.-])(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)|\d{2,4})[\s.-]\d{2,4}[\s.-]\d{2,5}(?![\s.-]?\d)/g;

export const phoneDetector = regexDetector({
  id: "phone",
  label: "Phone number",
  matchLabel: "PHONE",
  pattern: PHONE_RE,
  validate(raw) {
    const digits = raw.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 13;
  },
});
