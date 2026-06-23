import { TALLEROK_API_URL } from '@/config/tallerokEnv';
import { env } from '@/config/env';

export type TallerOkApiLogEntry = {
  timestamp: string;
  method: string;
  endpoint: string;
  baseUrl: string;
  status: number;
  durationMs: number;
  usedToken: boolean;
  error?: string;
};

export type TallerOkApiLogSummary = {
  lastStatus: number | null;
  lastEndpoint: string | null;
  lastError: string | null;
  lastCheckAt: string | null;
};

const MAX_ENTRIES = 50;

let entries: TallerOkApiLogEntry[] = [];
let summary: TallerOkApiLogSummary = {
  lastStatus: null,
  lastEndpoint: null,
  lastError: null,
  lastCheckAt: null,
};

type Listener = (summary: TallerOkApiLogSummary) => void;
const listeners = new Set<Listener>();

function notifyListeners(): void {
  for (const listener of listeners) {
    listener({ ...summary });
  }
}

function updateSummary(entry: TallerOkApiLogEntry): void {
  summary = {
    lastStatus: entry.status,
    lastEndpoint: entry.endpoint,
    lastError: entry.error ?? (entry.status >= 400 ? `HTTP ${entry.status}` : null),
    lastCheckAt: entry.timestamp,
  };
  notifyListeners();
}

export function logTallerOkApiRequest(entry: Omit<TallerOkApiLogEntry, 'timestamp' | 'baseUrl'>): void {
  const fullEntry: TallerOkApiLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
    baseUrl: TALLEROK_API_URL,
  };

  updateSummary(fullEntry);

  if (!env.isDevelopment) {
    return;
  }

  entries = [fullEntry, ...entries].slice(0, MAX_ENTRIES);

  const statusLabel = entry.status === 0 ? 'NETWORK' : String(entry.status);
  const tokenLabel = entry.usedToken ? 'con token' : 'sin token';
  const errorSuffix = entry.error ? ` · ${entry.error}` : '';

  console.log(
    `[TallerOK API] ${fullEntry.timestamp} ${entry.method} ${entry.endpoint} → ${statusLabel} (${entry.durationMs}ms, ${tokenLabel})${errorSuffix}`,
  );
}

export function getTallerOkApiLogSummary(): TallerOkApiLogSummary {
  return { ...summary };
}

export function getTallerOkApiLogEntries(): TallerOkApiLogEntry[] {
  return [...entries];
}

export function subscribeTallerOkApiLog(listener: Listener): () => void {
  listeners.add(listener);
  listener({ ...summary });
  return () => listeners.delete(listener);
}

export function clearTallerOkApiLogSummary(): void {
  summary = {
    lastStatus: null,
    lastEndpoint: null,
    lastError: null,
    lastCheckAt: null,
  };
  notifyListeners();
}
