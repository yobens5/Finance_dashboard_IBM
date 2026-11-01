// ─── marketSlice store tests ──────────────────────────────────────────────
// Tests the Zustand store in isolation by mocking financeService so no
// network or adapter calls are made.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

// ── mock the finance service before importing the store ───────────────────

vi.mock('../../services/finance/financeService', () => ({
  fetchQuote: vi.fn(),
  fetchHistory: vi.fn(),
  rebaseHistory: (pts: unknown[]) => pts,
  FinanceError: class FinanceError extends Error {
    code: string;
    symbol: string | undefined;
    constructor(code: string, message: string, symbol?: string) {
      super(message);
      this.name = 'FinanceError';
      this.code = code;
      this.symbol = symbol;
    }
  },
}));

import { fetchQuote, fetchHistory } from '../../services/finance/financeService';
import { useMarketStore } from '../../store/marketSlice';

const mockFetchQuote = vi.mocked(fetchQuote);
const mockFetchHistory = vi.mocked(fetchHistory);

// ── helpers ───────────────────────────────────────────────────────────────

const MOCK_QUOTE = {
  symbol: 'IBM',
  companyName: 'IBM',
  price: 180,
  previousClose: 178,
  change: 2,
  changePercent: 1.12,
  volume: 5_000_000,
  marketCap: null,
  currency: 'USD',
  timestamp: Date.now(),
};

const MOCK_HISTORY = [
  { date: '2024-01-01', open: 178, high: 182, low: 176, close: 180, volume: 1e6, rebased: 100 },
  { date: '2024-01-02', open: 180, high: 185, low: 179, close: 183, volume: 1.1e6, rebased: 101.67 },
];

// ── test suite ─────────────────────────────────────────────────────────────

describe('useMarketStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useMarketStore.setState({
      quotes: {},
      history: {},
      loadingSymbols: new Set(),
      errors: {},
      activeWindow: 'DAY',
    });
    vi.resetAllMocks();
  });

  it('initialises with empty quotes and DAY window', () => {
    const { result } = renderHook(() => useMarketStore());
    expect(result.current.quotes).toEqual({});
    expect(result.current.activeWindow).toBe('DAY');
    expect(result.current.loadingSymbols.size).toBe(0);
  });

  it('setWindow updates activeWindow', () => {
    const { result } = renderHook(() => useMarketStore());
    act(() => result.current.setWindow('WEEK'));
    expect(result.current.activeWindow).toBe('WEEK');
  });

  it('loadQuote stores the returned quote', async () => {
    mockFetchQuote.mockResolvedValueOnce(MOCK_QUOTE);
    const { result } = renderHook(() => useMarketStore());

    await act(async () => {
      await result.current.loadQuote('IBM');
    });

    expect(result.current.quotes['IBM']).toMatchObject({ symbol: 'IBM', price: 180 });
    expect(result.current.loadingSymbols.has('IBM')).toBe(false);
  });

  it('loadQuote records an error on failure', async () => {
    mockFetchQuote.mockRejectedValueOnce(new Error('network timeout'));
    const { result } = renderHook(() => useMarketStore());

    await act(async () => {
      await result.current.loadQuote('IBM');
    });

    expect(result.current.errors['IBM']).toBe('network timeout');
    expect(result.current.loadingSymbols.has('IBM')).toBe(false);
  });

  it('loadHistory stores points under the correct window key', async () => {
    mockFetchHistory.mockResolvedValueOnce(MOCK_HISTORY);
    const { result } = renderHook(() => useMarketStore());

    await act(async () => {
      await result.current.loadHistory('IBM', 'WEEK');
    });

    expect(result.current.history['IBM']?.['WEEK']).toHaveLength(2);
    expect(result.current.loadingSymbols.has('IBM-WEEK')).toBe(false);
  });

  it('loadHistory records an error on failure', async () => {
    mockFetchHistory.mockRejectedValueOnce(new Error('rate limited'));
    const { result } = renderHook(() => useMarketStore());

    await act(async () => {
      await result.current.loadHistory('IBM', 'QUARTER');
    });

    expect(result.current.errors['IBM-QUARTER']).toBe('rate limited');
  });

  it('clearError removes the error for a symbol', async () => {
    useMarketStore.setState({ errors: { IBM: 'some error' } });
    const { result } = renderHook(() => useMarketStore());

    act(() => result.current.clearError('IBM'));

    expect(result.current.errors['IBM']).toBeUndefined();
  });
});
