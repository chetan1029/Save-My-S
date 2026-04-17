import type { SiteAdapter } from "./base";
import {
  findFirstMatching,
  getEditableText,
  setEditableText,
} from "./contentEditable";

export const claudeAdapter: SiteAdapter = {
  name: "claude",

  matches(host) {
    return host === "claude.ai" || host.endsWith(".claude.ai");
  },

  findInput() {
    return findFirstMatching([
      "div[contenteditable='true'].ProseMirror",
      "fieldset div[contenteditable='true']",
      "div[contenteditable='true']",
    ]);
  },

  findSendButton() {
    return findFirstMatching([
      "button[aria-label='Send message']",
      "button[aria-label*='Send' i]",
      "fieldset button[type='button']:has(svg)",
    ]);
  },

  getText: getEditableText,
  setText: setEditableText,
};
