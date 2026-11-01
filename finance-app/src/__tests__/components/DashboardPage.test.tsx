// ─── DashboardPage integration smoke test ────────────────────────────────
// Renders the full DashboardPage + CompanyGrid tree against mock data
// pre-loaded into the Zustand store. No network calls are made.
//
// Strategy: pre-seed the store with all data + empty loadingSymbols so the
// useMarketData effect fires but finds everything cached and does nothing
// visible. For the WEEK/QUARTER chart tests we use findByTestId (async)
// so the test waits for the post-mount effect to settle.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardPage } from '../../components/dashboard/DashboardPage';
import { useMarketStore } from '../../store/marketSlice';

// ── mock the finance service so store actions never hit the network ────────

vi.mock('../../services/finance/financeService', () => ({
  fetchQuote: vi.fn().mockResolvedValue({
    symbol: 'IBM',
    companyName: 'IBM',
    price: 200,
    previousClose: 198,
    change: 2,
    changePercent: 1.01,
    volume: 5_000_000,
    marketCap: null,
    currency: 'USD',
    timestamp: Date.now(),
  }),
  fetchHistory: vi.fn().mockResolvedValue([
    { date: '2024-01-01', open: 198, high: 202, low: 196, close: 200, volume: 1e6, rebased: 100 },
    { date: '2024-01-02', open: 200, high: 205, low: 199, close: 203, volume: 1.1e6, rebased: 101.5 },
  ]),
  rebaseHistory: (pts: unknown[]) => pts,
  FinanceError: class extends Error {},
}));

// ── helpers ────────────────────────────────────────────────────────────────

const SYMBOLS = ['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM'] as const;

function makeQuote(symbol: string) {
  return {
    symbol,
    companyName: symbol,
    price: 200,
    previousClose: 198,
    change: 2,
    changePercent: 1.01,
    volume: 5_000_000,
    marketCap: null,
    currency: 'USD',
    timestamp: Date.now(),
  };
}

const WEEK_HISTORY = [
  { date: '2024-01-01', open: 198, high: 202, low: 196, close: 200, volume: 1e6, rebased: 100 },
  { date: '2024-01-02', open: 200, high: 205, low: 199, close: 203, volume: 1.1e6, rebased: 101.5 },
];

/** Pre-populate the store with fixture data for all 5 companies. */
function seedStore() {
  const quotes = Object.fromEntries(SYMBOLS.map((s) => [s, makeQuote(s)]));
  const history = Object.fromEntries(
    SYMBOLS.map((s) => [s, { WEEK: WEEK_HISTORY, QUARTER: WEEK_HISTORY }])
  );
  useMarketStore.setState({
    quotes,
    history,
    // Empty loading set = no in-flight requests; charts render immediately.
    loadingSymbols: new Set(),
    errors: {},
    activeWindow: 'DAY',
  });
}

function resetStore() {
  useMarketStore.setState({
    quotes: {},
    history: {},
    loadingSymbols: new Set(),
    errors: {},
    activeWindow: 'DAY',
  });
}

// ── test suites ────────────────────────────────────────────────────────────

describe('DashboardPage integration', () => {
  beforeEach(() => {
    resetStore();
    seedStore();
  });

  it('renders a SummaryCard for every company in DAY view', () => {
    render(<DashboardPage window="DAY" />);
    for (const sym of SYMBOLS) {
      expect(screen.getByTestId(`summary-card-${sym}`)).toBeInTheDocument();
    }
  });

  it('renders CompanyCharts for WEEK view', async () => {
    render(<DashboardPage window="WEEK" />);
    // useMarketData fires loadHistory in useEffect; wait for charts to appear
    for (const sym of SYMBOLS) {
      await screen.findByTestId(`company-chart-${sym}`);
    }
  });

  it('renders CompanyCharts for QUARTER view', async () => {
    render(<DashboardPage window="QUARTER" />);
    await waitFor(() => {
      expect(screen.getAllByTestId(/^company-chart-/).length).toBe(5);
    });
  });

  it('does not render charts in DAY view', () => {
    render(<DashboardPage window="DAY" />);
    expect(screen.queryAllByTestId(/^company-chart-/).length).toBe(0);
  });

  it('shows prices in SummaryCards', () => {
    render(<DashboardPage window="DAY" />);
    const cards = screen.getAllByTestId(/^summary-card-/);
    expect(cards.length).toBe(5);
    cards.forEach((card) => {
      expect(card).toHaveTextContent('$200.00');
    });
  });

  it('shows the EmptyState when no data and no loading', async () => {
    // Stub out store actions so the useMarketData effect never sets loading state.
    const noopSpy = vi.fn().mockResolvedValue(undefined);
    useMarketStore.setState({
      quotes: {},
      history: {},
      loadingSymbols: new Set(),
      errors: {},
      loadQuote: noopSpy,
      loadHistory: noopSpy,
    } as unknown as Parameters<typeof useMarketStore.setState>[0]);

    render(<DashboardPage window="DAY" />);

    // After the useEffect fires the no-op actions, loadingSymbols stays empty
    // and quotes stays empty → EmptyState should be visible.
    await waitFor(() => {
      expect(screen.getByText(/no market data/i)).toBeInTheDocument();
    });
  });
});

describe('DashboardPage error handling', () => {
  beforeEach(() => {
    resetStore();
    seedStore();
  });

  it('displays an error banner for a symbol with a stored error', () => {
    useMarketStore.setState({ errors: { IBM: 'rate limited' } });
    render(<DashboardPage window="DAY" />);
    expect(screen.getByText(/rate limited/i)).toBeInTheDocument();
  });

  it('dismisses an error banner on click', async () => {
    useMarketStore.setState({ errors: { IBM: 'network error' } });
    render(<DashboardPage window="DAY" />);

    const dismissBtn = screen.getByRole('button', { name: /dismiss/i });
    await userEvent.click(dismissBtn);

    expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
  });
});
