// ─── useCompanySearch hook ─────────────────────────────────────────────────
// Drives the "Spotlight" panel: fetches quote + history for any user-supplied
// ticker symbol. Re-fetches history automatically when the active tab changes.

import { useEffect, useRef, useState } from 'react';
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

  // Track the last successfully searched symbol so a tab switch can re-fetch
  // history for the new window without requiring a fresh user search.
  const lastSymbol = useRef('');

  async function search(symbol: string) {
    const upper = symbol.trim().toUpperCase();
    if (!upper) return;
    lastSymbol.current = upper;
    setState({ quote: null, history: [], isLoading: true, error: null });
    try {
      const [quote, history] = await Promise.all([
        fetchQuote(upper),
        window !== 'DAY' ? fetchHistory(upper, window) : Promise.resolve([]),
      ]);
      setState({ quote, history, isLoading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Symbol not found';
      setState({ quote: null, history: [], isLoading: false, error: message });
    }
  }

  // When the active time window changes (tab switch) and a symbol is already
  // loaded, silently refresh the history slice for the new window. Quote data
  // stays intact so the SummaryCard does not flicker.
  useEffect(() => {
    const sym = lastSymbol.current;
    if (!sym) return;
    if (window === 'DAY') {
      // No history needed for DAY; just clear any stale history slice.
      setState((s) => ({ ...s, history: [] }));
      return;
    }
    setState((s) => ({ ...s, isLoading: true }));
    fetchHistory(sym, window)
      .then((history) => setState((s) => ({ ...s, history, isLoading: false })))
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed to load history';
        setState((s) => ({ ...s, history: [], isLoading: false, error: message }));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window]);

  function reset() {
    lastSymbol.current = '';
    setState({ quote: null, history: [], isLoading: false, error: null });
  }

  return { ...state, search, reset };
}
