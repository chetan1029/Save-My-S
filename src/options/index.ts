import {
  getSettings,
  setSettings,
  getStats,
  resetStats,
  isHostAllowlisted,
  type Settings,
  type CustomPattern,
} from "../storage";
import { builtInDetectors } from "../detectors";
import { SUPPORTED_SITES } from "../sites";

const $ = <T extends HTMLElement>(sel: string) =>
  document.querySelector(sel) as T;

const enabledEl = $<HTMLInputElement>("#enabled");
const sitesEl = $<HTMLDivElement>("#sites");
const enableAllSitesBtn = $<HTMLButtonElement>("#enableAllSites");
const detectorsEl = $<HTMLDivElement>("#detectors");
const patternsEl = $<HTMLDivElement>("#patterns");
const addPatternBtn = $<HTMLButtonElement>("#addPattern");
const allowlistEl = $<HTMLTextAreaElement>("#allowlist");
const statsEl = $<HTMLDivElement>("#stats");
const resetStatsBtn = $<HTMLButtonElement>("#resetStats");
const statusEl = $<HTMLSpanElement>("#status");

let working: Settings = {
  enabled: true,
  detectorEnabled: {},
  customPatterns: [],
  domainAllowlist: [],
};

let loaded = false;
let pendingTimer: number | null = null;

function flash(msg = "Saved") {
  statusEl.textContent = msg;
  statusEl.classList.add("visible");
  window.setTimeout(() => statusEl.classList.remove("visible"), 1200);
}

async function persist() {
  if (!loaded) return;
  const snapshot: Settings = {
    enabled: working.enabled,
    detectorEnabled: { ...working.detectorEnabled },
    customPatterns: working.customPatterns.filter(
      (p) => p.pattern.trim().length > 0,
    ),
    domainAllowlist: [...working.domainAllowlist],
  };
  await setSettings(snapshot);
  flash();
}

function persistSoon() {
  if (pendingTimer !== null) window.clearTimeout(pendingTimer);
  pendingTimer = window.setTimeout(() => {
    pendingTimer = null;
    void persist();
  }, 400);
}

function renderSites() {
  sitesEl.innerHTML = "";
  for (const site of SUPPORTED_SITES) {
    const disabled = isHostAllowlisted(site.host, working.domainAllowlist);
    const row = document.createElement("div");
    row.className = "site";
    row.innerHTML = `
      <div class="meta">
        <span class="name">
          ${escape(site.name)}
          ${site.customAdapter ? '<span class="badge">verified</span>' : ""}
        </span>
        <span class="host"><a href="${escape(site.url)}" target="_blank" rel="noopener noreferrer">${escape(site.host)}</a></span>
      </div>
      <label class="switch">
        <input type="checkbox" ${disabled ? "" : "checked"} />
        <span class="slider"></span>
      </label>
    `;
    const cb = row.querySelector<HTMLInputElement>("input")!;
    cb.addEventListener("change", () => {
      const list = new Set(working.domainAllowlist);
      if (cb.checked) {
        list.delete(site.host);
        for (const e of [...list]) {
          if (e.startsWith("*.") && site.host.endsWith(e.slice(1))) list.delete(e);
        }
      } else {
        list.add(site.host);
      }
      working.domainAllowlist = [...list];
      allowlistEl.value = working.domainAllowlist.join("\n");
      void persist();
    });
    sitesEl.appendChild(row);
  }
}

function renderDetectors() {
  detectorsEl.innerHTML = "";
  for (const d of builtInDetectors) {
    const id = `det-${d.id}`;
    const checked = working.detectorEnabled[d.id] !== false;
    const row = document.createElement("div");
    row.className = "detector";
    row.innerHTML = `
      <label for="${id}">${d.label}</label>
      <input type="checkbox" id="${id}" ${checked ? "checked" : ""} />
    `;
    const cb = row.querySelector("input")!;
    cb.addEventListener("change", () => {
      working.detectorEnabled[d.id] = cb.checked;
      void persist();
    });
    detectorsEl.appendChild(row);
  }
}

function renderPatterns() {
  patternsEl.innerHTML = "";
  working.customPatterns.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "pattern-row";
    row.innerHTML = `
      <input type="text" placeholder="Label" value="${escape(p.label)}" data-k="label" />
      <input type="text" placeholder="Regex pattern" value="${escape(p.pattern)}" data-k="pattern" />
      <input type="text" placeholder="flags" value="${escape(p.flags)}" data-k="flags" />
      <button type="button" class="remove">Remove</button>
    `;
    row.querySelectorAll<HTMLInputElement>("input").forEach((inp) => {
      inp.addEventListener("input", () => {
        const k = inp.dataset.k as keyof CustomPattern;
        (working.customPatterns[i] as unknown as Record<string, string>)[k] = inp.value;
        persistSoon();
      });
    });
    row.querySelector(".remove")!.addEventListener("click", () => {
      working.customPatterns.splice(i, 1);
      renderPatterns();
      void persist();
    });
    patternsEl.appendChild(row);
  });
}

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

async function renderStats() {
  const s = await getStats();
  const totalCard = `<div class="stat"><span class="k">Total detections</span><span class="v">${s.totalDetections}</span></div>`;
  const items = Object.entries(s.byDetector)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .map(
      ([k, v]) =>
        `<div class="stat"><span class="k">${escape(k)}</span><span class="v">${v ?? 0}</span></div>`,
    )
    .join("");
  const since = new Date(s.lastReset).toLocaleString();
  statsEl.innerHTML =
    totalCard +
    items +
    `<div class="stat"><span class="k">Since</span><span class="v">${escape(since)}</span></div>`;
}

async function load() {
  working = await getSettings();
  enabledEl.checked = working.enabled;
  allowlistEl.value = working.domainAllowlist.join("\n");
  renderSites();
  renderDetectors();
  renderPatterns();
  await renderStats();
  loaded = true;
}

enabledEl.addEventListener("change", () => {
  working.enabled = enabledEl.checked;
  void persist();
});

enableAllSitesBtn.addEventListener("click", () => {
  const supportedHosts = new Set(SUPPORTED_SITES.map((s) => s.host));
  working.domainAllowlist = working.domainAllowlist.filter(
    (entry) => !supportedHosts.has(entry) && !supportedHosts.has(entry.replace(/^\*\./, "")),
  );
  allowlistEl.value = working.domainAllowlist.join("\n");
  renderSites();
  void persist();
});

addPatternBtn.addEventListener("click", () => {
  working.customPatterns.push({
    id: crypto.randomUUID(),
    label: "",
    pattern: "",
    flags: "g",
  });
  renderPatterns();
});

resetStatsBtn.addEventListener("click", async () => {
  await resetStats();
  await renderStats();
  flash("Counters reset");
});

allowlistEl.addEventListener("input", () => {
  working.domainAllowlist = allowlistEl.value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  renderSites();
  persistSoon();
});

void load();
