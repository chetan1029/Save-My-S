import type { Match } from "../detectors";
import type { SubmitDecision } from "../adapters/base";

const HOST_ID = "sms-modal-host";

const CSS = `
:host { all: initial; }
.sms-overlay {
  position: fixed; inset: 0; z-index: 2147483647;
  background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
}
.sms-modal {
  background: #1f1f23; color: #f5f5f7;
  width: min(640px, 92vw); max-height: 86vh;
  border-radius: 12px; box-shadow: 0 24px 64px rgba(0,0,0,0.5);
  display: flex; flex-direction: column; overflow: hidden;
  border: 1px solid #2e2e35;
}
.sms-header {
  padding: 16px 20px; border-bottom: 1px solid #2e2e35;
  display: flex; align-items: center; gap: 10px;
}
.sms-title { font-size: 15px; font-weight: 600; }
.sms-pill {
  background: #f59e0b; color: #1f1f23; font-size: 11px;
  font-weight: 700; padding: 2px 8px; border-radius: 999px;
}
.sms-body { padding: 16px 20px; overflow-y: auto; }
.sms-section-label {
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
  color: #9ca3af; margin: 0 0 6px 0;
}
.sms-preview {
  background: #111114; border: 1px solid #2e2e35; border-radius: 8px;
  padding: 10px 12px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.5px; line-height: 1.5; white-space: pre-wrap; word-break: break-word;
  max-height: 200px; overflow-y: auto; color: #f5f5f7;
}
.sms-redaction { background: #fde68a; color: #1f1f23; padding: 0 4px; border-radius: 3px; font-weight: 600; }
.sms-list { margin: 8px 0 0 0; padding: 0; list-style: none; font-size: 12.5px; }
.sms-list li { padding: 4px 0; color: #d1d5db; }
.sms-list code { background: #111114; padding: 1px 6px; border-radius: 4px; font-size: 12px; color: #f5f5f7; }
.sms-footer {
  padding: 12px 20px; border-top: 1px solid #2e2e35;
  display: flex; justify-content: flex-end; gap: 8px;
}
.sms-btn {
  border: 1px solid transparent; border-radius: 8px;
  padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer;
  font-family: inherit;
}
.sms-btn-primary { background: #10b981; color: #06281f; }
.sms-btn-primary:hover { background: #34d399; }
.sms-btn-danger { background: transparent; color: #f87171; border-color: #4b1f1f; }
.sms-btn-danger:hover { background: #2a1212; }
.sms-btn-ghost { background: transparent; color: #d1d5db; border-color: #3a3a42; }
.sms-btn-ghost:hover { background: #2a2a31; }
.sms-stack { display: flex; flex-direction: column; gap: 14px; }
`;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderRedactedPreview(redacted: string): string {
  return escapeHtml(redacted).replace(
    /\[([A-Z_]+_\d+)\]/g,
    (_, tag) => `<span class="sms-redaction">[${tag}]</span>`,
  );
}

export type ModalContext = "send" | "paste";

const LABELS: Record<ModalContext, { title: string; primary: string; danger: string }> = {
  send: { title: "Sensitive content detected", primary: "Send redacted", danger: "Send original" },
  paste: { title: "Paste contains sensitive content", primary: "Paste redacted", danger: "Paste original" },
};

export function showConfirmModal(
  original: string,
  redacted: string,
  matches: Match[],
  context: ModalContext = "send",
): Promise<SubmitDecision> {
  return new Promise<SubmitDecision>((resolve) => {
    document.getElementById(HOST_ID)?.remove();

    const host = document.createElement("div");
    host.id = HOST_ID;
    const shadow = host.attachShadow({ mode: "open" });

    const list = matches
      .map(
        (m) =>
          `<li>${escapeHtml(m.label)} — <code>${escapeHtml(m.value)}</code></li>`,
      )
      .join("");

    shadow.innerHTML = `
      <style>${CSS}</style>
      <div class="sms-overlay" part="overlay">
        <div class="sms-modal" role="dialog" aria-modal="true" aria-label="Sensitive content detected">
          <div class="sms-header">
            <span class="sms-pill">${matches.length}</span>
            <span class="sms-title">${LABELS[context].title}</span>
          </div>
          <div class="sms-body">
            <div class="sms-stack">
              <div>
                <p class="sms-section-label">Will be sent (redacted)</p>
                <div class="sms-preview">${renderRedactedPreview(redacted)}</div>
              </div>
              <div>
                <p class="sms-section-label">Detections</p>
                <ul class="sms-list">${list}</ul>
              </div>
            </div>
          </div>
          <div class="sms-footer">
            <button type="button" class="sms-btn sms-btn-ghost" data-action="cancel">Cancel</button>
            <button type="button" class="sms-btn sms-btn-danger" data-action="original">${LABELS[context].danger}</button>
            <button type="button" class="sms-btn sms-btn-primary" data-action="redacted">${LABELS[context].primary}</button>
          </div>
        </div>
      </div>
    `;

    let settled = false;
    const finish = (d: SubmitDecision) => {
      if (settled) return;
      settled = true;
      document.removeEventListener("keydown", onKey, true);
      host.remove();
      resolve(d);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        finish({ kind: "cancel" });
      }
    };

    const overlay = shadow.querySelector<HTMLElement>(".sms-overlay")!;
    overlay.addEventListener(
      "click",
      (e) => {
        e.stopPropagation();
        const target = e.target as HTMLElement;
        const btn = target.closest<HTMLButtonElement>("button[data-action]");
        if (btn) {
          const action = btn.dataset.action;
          if (action === "redacted") finish({ kind: "send-redacted", redacted });
          else if (action === "original") finish({ kind: "send-original" });
          else finish({ kind: "cancel" });
          return;
        }
        if (target === overlay) finish({ kind: "cancel" });
      },
      true,
    );

    document.addEventListener("keydown", onKey, true);
    document.documentElement.appendChild(host);
    void original;
  });
}
