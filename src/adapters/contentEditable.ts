export function getEditableText(input: HTMLElement): string {
  if (input instanceof HTMLTextAreaElement) return input.value;
  return input.innerText;
}

export function setEditableText(input: HTMLElement, text: string): void {
  if (input instanceof HTMLTextAreaElement) {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    setter?.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  input.focus();
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(input);
  sel?.removeAllRanges();
  sel?.addRange(range);
  document.execCommand("delete");

  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) document.execCommand("insertParagraph");
    if (lines[i].length > 0) document.execCommand("insertText", false, lines[i]);
  }
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

export function findFirstMatching(selectors: string[]): HTMLElement | null {
  for (const sel of selectors) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) return el;
  }
  return null;
}
