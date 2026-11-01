// ─── useMarketData hook ─────────────────────────────────────────────────────
// Drives data loading for all configured companies for the active time window.

import { useEffect } from 'react';
import { COMPANIES } from '../services/config';
import type { TimeWindow } from '../services/finance/types';
import { useMarketStore } from '../store/marketSlice';

export function useMarketData(window: TimeWindow) {
  const { quotes, history, loadingSymbols, errors, loadQuote, loadHistory } =
    useMarketStore();

  useEffect(() => {
    for (const { symbol } of COMPANIES) {
      loadQuote(symbol);
      if (window !== 'DAY') {
        loadHistory(symbol, window);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window]);

  const isLoading = loadingSymbols.size > 0;

  return { quotes, history, isLoading, errors };
}
