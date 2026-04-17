import type { Match } from "../detectors";

const HOST_ID = "sms-indicator-host";

const CSS = `
:host { all: initial; }
.sms-chip {
  position: fixed; z-index: 2147483646;
  background: #1f1f23; color: #f5f5f7;
  border: 1px solid #f59e0b;
  border-radius: 999px;
  padding: 6px 12px;
  font: 600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  box-shadow: 0 6px 20px rgba(0,0,0,0.35);
  display: inline-flex; align-items: center; gap: 8px;
  pointer-events: none;
  transition: opacity 120ms ease;
  opacity: 0;
}
.sms-chip.visible { opacity: 1; }
.sms-dot { width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; }
.sms-types { color: #d1d5db; font-weight: 500; font-size: 11px; }
`;

let host: HTMLElement | null = null;
let chip: HTMLElement | null = null;
let typesEl: HTMLElement | null = null;
let countEl: HTMLElement | null = null;

function ensureChip() {
  if (host && document.documentElement.contains(host)) return;
  host = document.createElement("div");
  host.id = HOST_ID;
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>${CSS}</style>
    <div class="sms-chip" part="chip">
      <span class="sms-dot"></span>
      <span class="sms-count">0</span>
      <span class="sms-types"></span>
    </div>
  `;
  chip = shadow.querySelector(".sms-chip");
  countEl = shadow.querySelector(".sms-count");
  typesEl = shadow.querySelector(".sms-types");
  document.documentElement.appendChild(host);
}

export function updateIndicator(matches: Match[], anchor: HTMLElement) {
  ensureChip();
  if (!chip || !countEl || !typesEl) return;
  if (matches.length === 0) {
    chip.classList.remove("visible");
    return;
  }
  const counts = new Map<string, number>();
  for (const m of matches) counts.set(m.label, (counts.get(m.label) ?? 0) + 1);
  const summary = Array.from(counts.entries())
    .map(([k, v]) => (v > 1 ? `${k}×${v}` : k))
    .join(" · ");
  countEl.textContent = `${matches.length} secret${matches.length === 1 ? "" : "s"}`;
  typesEl.textContent = summary;

  const r = anchor.getBoundingClientRect();
  const top = Math.max(8, r.top - 36);
  const right = Math.max(8, window.innerWidth - r.right);
  chip.style.top = `${top}px`;
  chip.style.right = `${right}px`;
  chip.style.left = "auto";
  chip.classList.add("visible");
}

export function hideIndicator() {
  if (chip) chip.classList.remove("visible");
}
