// ─── financeService tests ──────────────────────────────────────────────────
// Uses mockAdapter by forcing it via vi.mock, so no network calls are made.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rebaseHistory } from '../../services/finance/financeService';
import type { HistoricalPoint } from '../../services/finance/types';

// ── rebaseHistory ──────────────────────────────────────────────────────────

describe('rebaseHistory', () => {
  it('returns empty array unchanged', () => {
    expect(rebaseHistory([])).toEqual([]);
  });

  it('sets first point rebased to 100', () => {
    const points: HistoricalPoint[] = [
      { date: '2024-01-01', open: 100, high: 105, low: 95, close: 100, volume: 1000 },
      { date: '2024-01-02', open: 105, high: 110, low: 100, close: 110, volume: 1200 },
    ];
    const result = rebaseHistory(points);
    expect(result[0].rebased).toBe(100);
    expect(result[1].rebased).toBeCloseTo(110, 1);
  });

  it('handles zero base price without throwing', () => {
    const points: HistoricalPoint[] = [
      { date: '2024-01-01', open: 0, high: 0, low: 0, close: 0, volume: 0 },
    ];
    expect(() => rebaseHistory(points)).not.toThrow();
  });

  it('does not mutate input array', () => {
    const points: HistoricalPoint[] = [
      { date: '2024-01-01', open: 50, high: 55, low: 48, close: 50, volume: 500 },
    ];
    const original = { ...points[0] };
    rebaseHistory(points);
    expect(points[0]).toEqual(original);
  });
});

// ── mockAdapter smoke tests ────────────────────────────────────────────────

describe('mockAdapter', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns a quote for IBM', async () => {
    const { mockAdapter } = await import('../../services/finance/mockAdapter');
    const quote = await mockAdapter.fetchQuote('IBM');
    expect(quote.symbol).toBe('IBM');
    expect(quote.price).toBeGreaterThan(0);
    expect(quote.currency).toBe('USD');
  });

  it('throws FinanceError NOT_FOUND for unknown symbol', async () => {
    const { mockAdapter } = await import('../../services/finance/mockAdapter');
    const { FinanceError } = await import('../../services/finance/types');
    await expect(mockAdapter.fetchQuote('UNKNOWN')).rejects.toThrow(FinanceError);
  });

  it('returns 7 history points for WEEK window', async () => {
    const { mockAdapter } = await import('../../services/finance/mockAdapter');
    const history = await mockAdapter.fetchHistory('IBM', 'WEEK');
    expect(history).toHaveLength(7);
  });

  it('returns 65 history points for QUARTER window', async () => {
    const { mockAdapter } = await import('../../services/finance/mockAdapter');
    const history = await mockAdapter.fetchHistory('IBM', 'QUARTER');
    expect(history).toHaveLength(65);
  });

  it('returns all required HistoricalPoint fields', async () => {
    const { mockAdapter } = await import('../../services/finance/mockAdapter');
    const [point] = await mockAdapter.fetchHistory('MSFT', 'WEEK');
    expect(point).toHaveProperty('date');
    expect(point).toHaveProperty('open');
    expect(point).toHaveProperty('high');
    expect(point).toHaveProperty('low');
    expect(point).toHaveProperty('close');
    expect(point).toHaveProperty('volume');
  });
});
