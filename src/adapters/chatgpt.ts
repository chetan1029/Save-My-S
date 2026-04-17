import type { SiteAdapter } from "./base";
import {
  findFirstMatching,
  getEditableText,
  setEditableText,
} from "./contentEditable";

export const chatgptAdapter: SiteAdapter = {
  name: "chatgpt",

  matches(host) {
    return host === "chatgpt.com" || host === "chat.openai.com";
  },

  findInput() {
    return findFirstMatching([
      "#prompt-textarea",
      "div.ProseMirror[contenteditable='true']",
      "div[contenteditable='true']",
    ]);
  },

  findSendButton() {
    return findFirstMatching([
      "button[data-testid='send-button']",
      "button[aria-label*='Send' i]",
    ]);
  },

  getText: getEditableText,
  setText: setEditableText,
};
