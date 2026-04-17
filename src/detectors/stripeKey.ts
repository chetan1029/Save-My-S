import { regexDetector } from "./regexHelper";

export const stripeKeyDetector = regexDetector({
  id: "stripeKey",
  label: "Stripe key",
  matchLabel: "STRIPE_KEY",
  pattern: /\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g,
});
