import {
  getSettings,
  patchSettings,
  getStats,
  isHostAllowlisted,
} from "../storage";
import { isSupportedHost } from "../sites";

const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T;
const enabledEl = $<HTMLInputElement>("#enabled");
const siteEl = $<HTMLDivElement>("#site");
const totalEl = $<HTMLDivElement>("#total");
const breakdownEl = $<HTMLDivElement>("#breakdown");
const statusCard = $<HTMLDivElement>("#statusCard");
const statusText = $<HTMLSpanElement>("#statusText");
const allowlistBtn = $<HTMLButtonElement>("#allowlistThis");
const optionsBtn = $<HTMLButtonElement>("#openOptions");

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

async function getActiveTabHost(): Promise<{ host: string; url: string } | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return null;
  try {
    const u = new URL(tab.url);
    return { host: u.hostname, url: tab.url };
  } catch {
    return null;
  }
}

async function refresh() {
  const [settings, stats, tab] = await Promise.all([
    getSettings(),
    getStats(),
    getActiveTabHost(),
  ]);

  enabledEl.checked = settings.enabled;
  totalEl.textContent = String(stats.totalDetections);

  const entries = Object.entries(stats.byDetector).sort(
    (a, b) => (b[1] ?? 0) - (a[1] ?? 0),
  );
  if (entries.length === 0) {
    breakdownEl.innerHTML = `<div class="empty">No secrets blocked yet.</div>`;
  } else {
    breakdownEl.innerHTML = entries
      .slice(0, 8)
      .map(
        ([k, v]) =>
          `<div class="row"><span class="k">${escape(k)}</span><span class="v">${v ?? 0}</span></div>`,
      )
      .join("");
  }

  const host = tab?.host ?? "";
  siteEl.textContent = host || "no active tab";

  statusCard.classList.remove("inactive", "disabled");
  if (!settings.enabled) {
    statusCard.classList.add("disabled");
    statusText.textContent = "Extension is off";
    allowlistBtn.disabled = true;
  } else if (!host || !isSupportedHost(host)) {
    statusCard.classList.add("inactive");
    statusText.textContent = "Not active on this site";
    allowlistBtn.disabled = true;
  } else if (isHostAllowlisted(host, settings.domainAllowlist)) {
    statusCard.classList.add("disabled");
    statusText.textContent = `Disabled on ${host}`;
    allowlistBtn.textContent = "Enable on this site";
    allowlistBtn.disabled = false;
  } else {
    statusText.textContent = `Active on ${host}`;
    allowlistBtn.textContent = "Disable on this site";
    allowlistBtn.disabled = false;
  }
}

enabledEl.addEventListener("change", async () => {
  await patchSettings({ enabled: enabledEl.checked });
  await refresh();
});

allowlistBtn.addEventListener("click", async () => {
  const tab = await getActiveTabHost();
  if (!tab) return;
  const settings = await getSettings();
  const list = new Set(settings.domainAllowlist);
  if (isHostAllowlisted(tab.host, settings.domainAllowlist)) {
    list.delete(tab.host);
    for (const e of [...list]) {
      if (e.startsWith("*.") && tab.host.endsWith(e.slice(1))) list.delete(e);
    }
  } else {
    list.add(tab.host);
  }
  await patchSettings({ domainAllowlist: [...list] });
  await refresh();
});

optionsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
  window.close();
});

void refresh();
