// ─── Finance service public API ────────────────────────────────────────────
// Selects the adapter based on the VITE_USE_MOCK environment variable and
// exposes a stable interface to the rest of the application.

import { mockAdapter } from './mockAdapter';
import { yahooAdapter } from './yahooAdapter';
import type { FinanceAdapter, HistoricalPoint, Quote, TimeWindow } from './types';
import { FinanceError } from './types';

// ── adapter selection ──────────────────────────────────────────────────────

const useMock =
  typeof import.meta !== 'undefined' &&
  (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_USE_MOCK === 'true';

const adapter: FinanceAdapter = useMock ? mockAdapter : yahooAdapter;

// ── retry helper ───────────────────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, retries = 1, delayMs = 2000): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof FinanceError && err.code === 'NETWORK' && retries > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
      return withRetry(fn, retries - 1, delayMs);
    }
    throw err;
  }
}

// ── rebasing helper ────────────────────────────────────────────────────────

export function rebaseHistory(points: HistoricalPoint[]): HistoricalPoint[] {
  if (points.length === 0) return points;
  const base = points[0].close;
  if (base === 0) return points;
  return points.map((p) => ({ ...p, rebased: +((p.close / base) * 100).toFixed(4) }));
}

// ── public API ─────────────────────────────────────────────────────────────

export async function fetchQuote(symbol: string): Promise<Quote> {
  return withRetry(() => adapter.fetchQuote(symbol));
}

export async function fetchHistory(
  symbol: string,
  window: TimeWindow,
): Promise<HistoricalPoint[]> {
  const raw = await withRetry(() => adapter.fetchHistory(symbol, window));
  return rebaseHistory(raw);
}

export { FinanceError };
export type { Quote, HistoricalPoint, TimeWindow };
