import type { SiteAdapter } from "./base";
import {
  findFirstMatching,
  getEditableText,
  setEditableText,
} from "./contentEditable";

export const geminiAdapter: SiteAdapter = {
  name: "gemini",

  matches(host) {
    return host === "gemini.google.com";
  },

  findInput() {
    return findFirstMatching([
      "div.ql-editor[contenteditable='true']",
      "rich-textarea div[contenteditable='true']",
      "div[contenteditable='true']",
    ]);
  },

  findSendButton() {
    return findFirstMatching([
      "button[aria-label='Send message']",
      "button.send-button",
      "button[aria-label*='Send' i]",
      "button[mattooltip*='Send' i]",
    ]);
  },

  getText: getEditableText,
  setText: setEditableText,
};
