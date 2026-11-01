// ─── Yahoo Finance adapter (yahoo-finance2 v4) ─────────────────────────────
// v4 API: `new YahooFinance()` instance; use yf.quote() + yf.chart().
// historical() is deprecated in v4 (underlying Yahoo API removed); chart()
// is the supported replacement for OHLCV time-series data.

import { default as YahooFinance } from 'yahoo-finance2';
import type { FinanceAdapter, HistoricalPoint, Quote, TimeWindow } from './types';
import { FinanceError } from './types';

// Suppress the one-time notices that print to stderr in CI / tests.
const yf = new YahooFinance({
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
});

function periodFor(window: TimeWindow): { period1: string; period2: string } {
  const now = new Date();
  const period2 = now.toISOString().slice(0, 10);
  const period1 = new Date(now);
  if (window === 'WEEK') period1.setDate(now.getDate() - 7);
  else if (window === 'QUARTER') period1.setDate(now.getDate() - 90);
  else period1.setDate(now.getDate() - 1); // DAY — yesterday to today
  return { period1: period1.toISOString().slice(0, 10), period2 };
}

export const yahooAdapter: FinanceAdapter = {
  async fetchQuote(symbol: string): Promise<Quote> {
    try {
      // v4: yf.quote() returns a QuoteResponse directly (no module wrapping)
      const q = await yf.quote(symbol);
      if (!q) throw new FinanceError('PARSE_ERROR', 'No quote data returned', symbol);

      return {
        symbol:        q.symbol ?? symbol,
        companyName:   q.longName ?? q.shortName ?? symbol,
        price:         q.regularMarketPrice          ?? 0,
        previousClose: q.regularMarketPreviousClose  ?? 0,
        change:        q.regularMarketChange         ?? 0,
        changePercent: (q.regularMarketChangePercent ?? 0) * 100,
        volume:        q.regularMarketVolume         ?? 0,
        marketCap:     q.marketCap                   ?? null,
        currency:      q.currency                    ?? 'USD',
        timestamp:     Date.now(),
      };
    } catch (err) {
      if (err instanceof FinanceError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
        throw new FinanceError('NOT_FOUND', msg, symbol);
      }
      if (msg.toLowerCase().includes('rate') || msg.includes('429')) {
        throw new FinanceError('RATE_LIMITED', msg, symbol);
      }
      throw new FinanceError('NETWORK', msg, symbol);
    }
  },

  async fetchHistory(symbol: string, window: TimeWindow): Promise<HistoricalPoint[]> {
    try {
      const { period1, period2 } = periodFor(window);
      // Use chart() — historical() is deprecated; Yahoo removed the underlying API.
      const result = await yf.chart(symbol, {
        period1,
        period2,
        interval: '1d',
      });

      const quotes = result?.quotes ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return quotes.map((r: any) => ({
        date:   r.date instanceof Date
                  ? r.date.toISOString().slice(0, 10)
                  : String(r.date).slice(0, 10),
        open:   Number(r.open)              || 0,
        high:   Number(r.high)              || 0,
        low:    Number(r.low)               || 0,
        close:  Number(r.close)             || Number(r.adjclose) || 0,
        volume: Number(r.volume)            || 0,
      }));
    } catch (err) {
      if (err instanceof FinanceError) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new FinanceError('NETWORK', msg, symbol);
    }
  },
};
