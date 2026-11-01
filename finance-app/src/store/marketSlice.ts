// ─── Zustand store for market data ─────────────────────────────────────────

import { create } from 'zustand';
import { fetchHistory, fetchQuote } from '../services/finance/financeService';
import type { HistoricalPoint, Quote, TimeWindow } from '../services/finance/types';

interface MarketState {
  quotes: Record<string, Quote>;
  history: Record<string, Partial<Record<TimeWindow, HistoricalPoint[]>>>;
  loadingSymbols: Set<string>;
  errors: Record<string, string>;
  activeWindow: TimeWindow;

  setWindow(window: TimeWindow): void;
  loadQuote(symbol: string): Promise<void>;
  loadHistory(symbol: string, window: TimeWindow): Promise<void>;
  clearError(symbol: string): void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  quotes: {},
  history: {},
  loadingSymbols: new Set(),
  errors: {},
  activeWindow: 'DAY',

  setWindow(window) {
    set({ activeWindow: window });
  },

  async loadQuote(symbol) {
    set((s) => ({ loadingSymbols: new Set([...s.loadingSymbols, symbol]) }));
    try {
      const quote = await fetchQuote(symbol);
      set((s) => {
        const loading = new Set(s.loadingSymbols);
        loading.delete(symbol);
        return {
          quotes: { ...s.quotes, [symbol]: quote },
          loadingSymbols: loading,
        };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set((s) => {
        const loading = new Set(s.loadingSymbols);
        loading.delete(symbol);
        return {
          errors: { ...s.errors, [symbol]: message },
          loadingSymbols: loading,
        };
      });
    }
  },

  async loadHistory(symbol, window) {
    set((s) => ({ loadingSymbols: new Set([...s.loadingSymbols, `${symbol}-${window}`]) }));
    try {
      const points = await fetchHistory(symbol, window);
      set((s) => {
        const key = `${symbol}-${window}`;
        const loading = new Set(s.loadingSymbols);
        loading.delete(key);
        return {
          history: {
            ...s.history,
            [symbol]: { ...(s.history[symbol] ?? {}), [window]: points },
          },
          loadingSymbols: loading,
        };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const key = `${symbol}-${window}`;
      set((s) => {
        const loading = new Set(s.loadingSymbols);
        loading.delete(key);
        return {
          errors: { ...s.errors, [key]: message },
          loadingSymbols: loading,
        };
      });
    }
  },

  clearError(symbol) {
    set((s) => {
      const errors = { ...s.errors };
      delete errors[symbol];
      return { errors };
    });
  },

  // expose for use via get()
  ...({} as { _get: typeof get }),
}));
