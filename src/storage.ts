import type { DetectorId } from "./detectors/types";

export interface CustomPattern {
  id: string;
  label: string;
  pattern: string;
  flags: string;
}

export interface Settings {
  enabled: boolean;
  detectorEnabled: Partial<Record<DetectorId, boolean>>;
  customPatterns: CustomPattern[];
  domainAllowlist: string[];
}

export interface Stats {
  totalDetections: number;
  byDetector: Partial<Record<string, number>>;
  lastReset: number;
}

const SETTINGS_KEY = "sms.settings";
const STATS_KEY = "sms.stats";

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  detectorEnabled: {},
  customPatterns: [],
  domainAllowlist: [],
};

export const DEFAULT_STATS: Stats = {
  totalDetections: 0,
  byDetector: {},
  lastReset: Date.now(),
};

export async function getSettings(): Promise<Settings> {
  const raw = await chrome.storage.local.get(SETTINGS_KEY);
  const stored = raw[SETTINGS_KEY] as Partial<Settings> | undefined;
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
}

export async function setSettings(s: Settings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: s });
}

export async function patchSettings(p: Partial<Settings>): Promise<Settings> {
  const cur = await getSettings();
  const next = { ...cur, ...p };
  await setSettings(next);
  return next;
}

export async function getStats(): Promise<Stats> {
  const raw = await chrome.storage.local.get(STATS_KEY);
  const stored = raw[STATS_KEY] as Partial<Stats> | undefined;
  return { ...DEFAULT_STATS, ...(stored ?? {}) };
}

export async function setStats(s: Stats): Promise<void> {
  await chrome.storage.local.set({ [STATS_KEY]: s });
}

export async function recordDetections(labels: string[]): Promise<void> {
  if (labels.length === 0) return;
  const cur = await getStats();
  const next: Stats = {
    ...cur,
    totalDetections: cur.totalDetections + labels.length,
    byDetector: { ...cur.byDetector },
  };
  for (const label of labels) {
    next.byDetector[label] = (next.byDetector[label] ?? 0) + 1;
  }
  await setStats(next);
}

export async function resetStats(): Promise<Stats> {
  const fresh: Stats = { ...DEFAULT_STATS, lastReset: Date.now() };
  await setStats(fresh);
  return fresh;
}

export function onSettingsChanged(cb: (s: Settings) => void): () => void {
  const handler = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ) => {
    if (area !== "local" || !changes[SETTINGS_KEY]) return;
    cb({ ...DEFAULT_SETTINGS, ...(changes[SETTINGS_KEY].newValue ?? {}) });
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}

export function isHostAllowlisted(host: string, allowlist: string[]): boolean {
  return allowlist.some((entry) => {
    const e = entry.trim().toLowerCase();
    if (!e) return false;
    if (e.startsWith("*.")) return host === e.slice(2) || host.endsWith(e.slice(1));
    return host === e;
  });
}
