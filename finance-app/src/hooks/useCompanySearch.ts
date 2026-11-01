// ─── useCompanySearch hook ─────────────────────────────────────────────────
// Supports the Part-2 "user-selected company" feature.
// Stub is defined here so the file exists and tests can import it early.

import { useState } from 'react';
import { fetchQuote, fetchHistory } from '../services/finance/financeService';
import type { HistoricalPoint, Quote, TimeWindow } from '../services/finance/types';

interface SearchState {
  quote: Quote | null;
  history: HistoricalPoint[];
  isLoading: boolean;
  error: string | null;
}

export function useCompanySearch(window: TimeWindow) {
  const [state, setState] = useState<SearchState>({
    quote: null,
    history: [],
    isLoading: false,
    error: null,
  });

  async function search(symbol: string) {
    if (!symbol.trim()) return;
    setState({ quote: null, history: [], isLoading: true, error: null });
    try {
      const [quote, history] = await Promise.all([
        fetchQuote(symbol),
        window !== 'DAY' ? fetchHistory(symbol, window) : Promise.resolve([]),
      ]);
      setState({ quote, history, isLoading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Symbol not found';
      setState({ quote: null, history: [], isLoading: false, error: message });
    }
  }

  function reset() {
    setState({ quote: null, history: [], isLoading: false, error: null });
  }

  return { ...state, search, reset };
}
