// ─── Mock adapter — static fixtures for tests and offline demos ────────────

import type { FinanceAdapter, HistoricalPoint, Quote, TimeWindow } from './types';
import { FinanceError } from './types';

// ── helpers ────────────────────────────────────────────────────────────────

function buildQuote(symbol: string, price: number, prev: number): Quote {
  const change = +(price - prev).toFixed(2);
  const changePercent = +((change / prev) * 100).toFixed(2);
  return {
    symbol,
    companyName: symbol,
    price,
    previousClose: prev,
    change,
    changePercent,
    volume: 5_000_000,
    marketCap: price * 900_000_000,
    currency: 'USD',
    timestamp: Date.now(),
  };
}

function buildHistory(basePrice: number, days: number): HistoricalPoint[] {
  const points: HistoricalPoint[] = [];
  let price = basePrice;
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    price = +(price * (1 + (Math.random() - 0.49) * 0.015)).toFixed(2);
    points.push({
      date: d.toISOString().slice(0, 10),
      open: price,
      high: +(price * 1.005).toFixed(2),
      low: +(price * 0.995).toFixed(2),
      close: price,
      volume: 5_000_000,
    });
  }
  return points;
}

// ── base prices per symbol ─────────────────────────────────────────────────

const BASE_PRICES: Record<string, number> = {
  IBM:  180,
  MSFT: 420,
  ORCL: 130,
  SAP:  200,
  CRM:  290,
};

const WINDOW_DAYS: Record<TimeWindow, number> = {
  DAY:     1,
  WEEK:    7,
  QUARTER: 65,
};

// ── adapter implementation ─────────────────────────────────────────────────

export const mockAdapter: FinanceAdapter = {
  async fetchQuote(symbol: string): Promise<Quote> {
    const base = BASE_PRICES[symbol.toUpperCase()];
    if (!base) {
      throw new FinanceError('NOT_FOUND', `Symbol not found: ${symbol}`, symbol);
    }
    return buildQuote(symbol.toUpperCase(), base * (1 + (Math.random() - 0.49) * 0.01), base);
  },

  async fetchHistory(symbol: string, window: TimeWindow): Promise<HistoricalPoint[]> {
    const base = BASE_PRICES[symbol.toUpperCase()];
    if (!base) {
      throw new FinanceError('NOT_FOUND', `Symbol not found: ${symbol}`, symbol);
    }
    const days = WINDOW_DAYS[window];
    return buildHistory(base, days);
  },
};
