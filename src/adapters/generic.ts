import type { SiteAdapter } from "./base";
import { getEditableText, setEditableText } from "./contentEditable";

const INPUT_SELECTORS =
  'textarea, div[contenteditable="true"], div[role="textbox"], [contenteditable="true"].ProseMirror, [contenteditable="true"].ql-editor';

const SEND_SELECTORS = [
  'button[aria-label*="send" i]',
  'button[data-testid*="send" i]',
  'button[aria-label*="submit" i]',
  'button[type="submit"]',
].join(", ");

export const genericAdapter: SiteAdapter = {
  name: "generic",

  matches() {
    return true;
  },

  findInput() {
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>(INPUT_SELECTORS),
    ).filter(isUsableInput);
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => scoreInput(b) - scoreInput(a));
    return candidates[0];
  },

  findSendButton() {
    const input = this.findInput();
    const scope = input
      ? (input.closest("form") as ParentNode | null) ??
        input.parentElement?.parentElement ??
        document
      : document;
    const scoped = scope.querySelectorAll<HTMLElement>(SEND_SELECTORS);
    for (const b of scoped) if (isVisible(b)) return b;
    const global = document.querySelectorAll<HTMLElement>(SEND_SELECTORS);
    for (const b of global) if (isVisible(b)) return b;
    return null;
  },

  getText: getEditableText,
  setText: setEditableText,
};

function isUsableInput(el: HTMLElement): boolean {
  if (!isVisible(el)) return false;
  const r = el.getBoundingClientRect();
  if (r.width < 120 || r.height < 20) return false;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    const placeholder = (el.placeholder ?? "").toLowerCase();
    if (/^search|find\.\.\.|filter/.test(placeholder)) return false;
    if (el.type && el.type !== "text" && el.type !== "search") {
      if (!(el instanceof HTMLTextAreaElement)) return false;
    }
  }
  return true;
}

function isVisible(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const style = getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  if (parseFloat(style.opacity) === 0) return false;
  return true;
}

function scoreInput(el: HTMLElement): number {
  const r = el.getBoundingClientRect();
  const area = r.width * r.height;
  const bottomDistance = Math.abs(window.innerHeight - r.bottom);
  const bottomBias = Math.max(0, window.innerHeight - bottomDistance) * 2;
  const focusBonus = el === document.activeElement ? 100000 : 0;
  return area + bottomBias + focusBonus;
}
