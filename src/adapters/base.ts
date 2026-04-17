export interface SiteAdapter {
  name: string;
  matches(host: string): boolean;
  findInput(): HTMLElement | null;
  findSendButton(): HTMLElement | null;
  getText(input: HTMLElement): string;
  setText(input: HTMLElement, text: string): void;
}

export type SubmitDecision =
  | { kind: "send-original" }
  | { kind: "send-redacted"; redacted: string }
  | { kind: "cancel" };

export type SubmitHandler = (text: string) => Promise<SubmitDecision>;
export type PasteHandler = (pasted: string) => Promise<SubmitDecision>;
export type InputObserver = (text: string, input: HTMLElement) => void;

export interface AdapterHooks {
  onSubmit: SubmitHandler;
  onPaste?: PasteHandler;
  onInput?: InputObserver;
}

const HANDLED = new WeakSet<HTMLElement>();

export function attachAdapter(adapter: SiteAdapter, hooks: AdapterHooks) {
  const tryWire = () => {
    const input = adapter.findInput();
    if (!input || HANDLED.has(input)) return;
    HANDLED.add(input);
    wireInput(adapter, input, hooks);
  };

  tryWire();
  const obs = new MutationObserver(() => tryWire());
  obs.observe(document.documentElement, { childList: true, subtree: true });
}

function wireInput(
  adapter: SiteAdapter,
  input: HTMLElement,
  hooks: AdapterHooks,
) {
  const intercept = async (
    raw: string,
    proceed: (textToSend: string) => void,
  ) => {
    const decision = await hooks.onSubmit(raw);
    if (decision.kind === "cancel") return;
    if (decision.kind === "send-original") {
      proceed(raw);
      return;
    }
    adapter.setText(input, decision.redacted);
    await new Promise<void>((r) => setTimeout(r, 50));
    proceed(decision.redacted);
  };

  input.addEventListener(
    "keydown",
    (e) => {
      const ke = e as KeyboardEvent;
      if (ke.key !== "Enter" || ke.shiftKey || ke.isComposing) return;
      const text = adapter.getText(input);
      if (!text.trim()) return;
      ke.preventDefault();
      ke.stopPropagation();
      void intercept(text, () => {
        clickSend(adapter);
      });
    },
    true,
  );

  if (hooks.onPaste) {
    const onPaste = hooks.onPaste;
    input.addEventListener(
      "paste",
      (e) => {
        const ce = e as ClipboardEvent;
        if ((ce as ClipboardEvent & { __smsBypass?: boolean }).__smsBypass) return;
        const data = ce.clipboardData?.getData("text/plain");
        if (!data) return;
        ce.preventDefault();
        ce.stopPropagation();
        void (async () => {
          const decision = await onPaste(data);
          if (decision.kind === "cancel") return;
          const toInsert = decision.kind === "send-redacted" ? decision.redacted : data;
          insertAtCursor(input, toInsert, adapter);
        })();
      },
      true,
    );
  }

  if (hooks.onInput) {
    const onInput = hooks.onInput;
    let scheduled = false;
    const flush = () => {
      scheduled = false;
      onInput(adapter.getText(input), input);
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      setTimeout(flush, 150);
    };
    input.addEventListener("input", schedule);
    input.addEventListener("keyup", schedule);
    flush();
  }

  const sendBtn = adapter.findSendButton();
  if (sendBtn) wireSendButton(adapter, sendBtn, intercept);

  const btnObs = new MutationObserver(() => {
    const btn = adapter.findSendButton();
    if (btn && !HANDLED.has(btn)) {
      HANDLED.add(btn);
      wireSendButton(adapter, btn, intercept);
    }
  });
  btnObs.observe(document.documentElement, { childList: true, subtree: true });
}

function wireSendButton(
  adapter: SiteAdapter,
  btn: HTMLElement,
  intercept: (raw: string, proceed: (t: string) => void) => Promise<void>,
) {
  btn.addEventListener(
    "click",
    (e) => {
      const input = adapter.findInput();
      if (!input) return;
      const text = adapter.getText(input);
      if (!text.trim()) return;
      if ((e as MouseEvent & { __smsBypass?: boolean }).__smsBypass) return;
      e.preventDefault();
      e.stopPropagation();
      void intercept(text, () => clickSend(adapter));
    },
    true,
  );
}

function clickSend(adapter: SiteAdapter) {
  const btn = adapter.findSendButton();
  if (!btn) return;
  const ev = new MouseEvent("click", { bubbles: true, cancelable: true }) as
    MouseEvent & { __smsBypass?: boolean };
  ev.__smsBypass = true;
  btn.dispatchEvent(ev);
}

function insertAtCursor(input: HTMLElement, text: string, adapter: SiteAdapter) {
  if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const next = input.value.slice(0, start) + text + input.value.slice(end);
    adapter.setText(input, next);
    return;
  }
  input.focus();
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) document.execCommand("insertParagraph");
    if (lines[i].length > 0) document.execCommand("insertText", false, lines[i]);
  }
  input.dispatchEvent(new Event("input", { bubbles: true }));
}
