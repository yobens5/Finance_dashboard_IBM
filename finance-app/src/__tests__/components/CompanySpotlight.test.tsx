// ─── CompanySpotlight component tests ────────────────────────────────────────
//
// Strategy: mock the finance service at the module level so no network calls are
// made. Each test controls what fetchQuote / fetchHistory resolve/reject with.
// The Zustand store is never written to by these tests — that verifies isolation.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompanySpotlight } from '../../components/dashboard/CompanySpotlight';
import { useMarketStore } from '../../store/marketSlice';

// ── Shared fixtures ────────────────────────────────────────────────────────

const MOCK_QUOTE = {
  symbol: 'NVDA',
  companyName: 'NVIDIA Corporation',
  price: 950.25,
  previousClose: 930.10,
  change: 20.15,
  changePercent: 2.17,
  volume: 30_000_000,
  marketCap: 2_350_000_000_000,
  currency: 'USD',
  timestamp: Date.now(),
};

const MOCK_HISTORY = [
  { date: '2024-07-01', open: 900, high: 960, low: 895, close: 940, volume: 25_000_000, rebased: 100 },
  { date: '2024-07-02', open: 940, high: 970, low: 935, close: 950, volume: 27_000_000, rebased: 101.06 },
  { date: '2024-07-03', open: 950, high: 980, low: 945, close: 960, volume: 28_000_000, rebased: 102.13 },
];

// ── Mock the finance service ───────────────────────────────────────────────

const mockFetchQuote = vi.fn();
const mockFetchHistory = vi.fn();

vi.mock('../../services/finance/financeService', () => ({
  fetchQuote: (...args: unknown[]) => mockFetchQuote(...args),
  fetchHistory: (...args: unknown[]) => mockFetchHistory(...args),
  rebaseHistory: (pts: unknown[]) => pts,
  FinanceError: class FinanceError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

// ── Helpers ────────────────────────────────────────────────────────────────

/** Capture the Zustand store state before and after a test to assert no writes. */
function storeSnapshot() {
  const s = useMarketStore.getState();
  return {
    quoteKeys: Object.keys(s.quotes),
    historyKeys: Object.keys(s.history),
    errorKeys: Object.keys(s.errors),
    loadingSize: s.loadingSymbols.size,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('CompanySpotlight — initial render', () => {
  it('renders the section heading', () => {
    render(<CompanySpotlight window="DAY" />);
    expect(screen.getByText(/Spotlight/i)).toBeInTheDocument();
  });

  it('renders the text input and Search button', () => {
    render(<CompanySpotlight window="DAY" />);
    expect(screen.getByRole('textbox', { name: /ticker symbol/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('does not render Clear, result, or error before any search', () => {
    render(<CompanySpotlight window="DAY" />);
    expect(screen.queryByTestId('spotlight-clear-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('spotlight-result')).not.toBeInTheDocument();
    expect(screen.queryByTestId('spotlight-error')).not.toBeInTheDocument();
  });
});

describe('CompanySpotlight — successful search (DAY)', () => {
  beforeEach(() => {
    mockFetchQuote.mockResolvedValue(MOCK_QUOTE);
    mockFetchHistory.mockResolvedValue(MOCK_HISTORY);
  });

  it('shows a SummaryCard with the searched ticker after a successful search', async () => {
    render(<CompanySpotlight window="DAY" />);

    await userEvent.type(screen.getByRole('textbox', { name: /ticker symbol/i }), 'NVDA');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByTestId('summary-card-NVDA')).toBeInTheDocument();
    });
  });

  it('shows the price inside the SummaryCard', async () => {
    render(<CompanySpotlight window="DAY" />);

    await userEvent.type(screen.getByRole('textbox', { name: /ticker symbol/i }), 'NVDA');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByTestId('summary-card-NVDA')).toHaveTextContent('$950.25');
    });
  });

  it('does NOT render a chart on the DAY tab', async () => {
    render(<CompanySpotlight window="DAY" />);

    await userEvent.type(screen.getByRole('textbox', { name: /ticker symbol/i }), 'NVDA');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => screen.getByTestId('spotlight-result'));
    expect(screen.queryByTestId('company-chart-NVDA')).not.toBeInTheDocument();
  });

  it('does not call fetchHistory on the DAY tab', async () => {
    render(<CompanySpotlight window="DAY" />);

    await userEvent.type(screen.getByRole('textbox', { name: /ticker symbol/i }), 'NVDA');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => screen.getByTestId('spotlight-result'));
    expect(mockFetchHistory).not.toHaveBeenCalled();
  });

  it('shows the Clear button once a result is visible', async () => {
    render(<CompanySpotlight window="DAY" />);

    await userEvent.type(screen.getByRole('textbox', { name: /ticker symbol/i }), 'NVDA');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByTestId('spotlight-clear-btn')).toBeInTheDocument();
    });
  });

  it('uppercases the symbol before searching', async () => {
    render(<CompanySpotlight window="DAY" />);

    await userEvent.type(screen.getByRole('textbox', { name: /ticker symbol/i }), 'nvda');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => screen.getByTestId('spotlight-result'));
    expect(mockFetchQuote).toHaveBeenCalledWith('NVDA');
  });
});

describe('CompanySpotlight — successful search (WEEK / QUARTER)', () => {
  beforeEach(() => {
    mockFetchQuote.mockResolvedValue(MOCK_QUOTE);
    mockFetchHistory.mockResolvedValue(MOCK_HISTORY);
  });

  it('renders a CompanyChart after a WEEK search', async () => {
    render(<CompanySpotlight window="WEEK" />);

    await userEvent.type(screen.getByRole('textbox', { name: /ticker symbol/i }), 'NVDA');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByTestId('company-chart-NVDA')).toBeInTheDocument();
    });
  });

  it('renders a CompanyChart after a QUARTER search', async () => {
    render(<CompanySpotlight window="QUARTER" />);

    await userEvent.type(screen.getByRole('textbox', { name: /ticker symbol/i }), 'NVDA');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByTestId('company-chart-NVDA')).toBeInTheDocument();
    });
  });

  it('calls fetchHistory with the correct window', async () => {
    render(<CompanySpotlight window="WEEK" />);

    await userEvent.type(screen.getByRole('textbox', { name: /ticker symbol/i }), 'NVDA');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => screen.getByTestId('spotlight-result'));
    expect(mockFetchHistory).toHaveBeenCalledWith('NVDA', 'WEEK');
  });
});

describe('CompanySpotlight — error handling', () => {
  it('shows a clear no-data error message for an unknown symbol', async () => {
    mockFetchQuote.mockRejectedValue(new Error('Symbol not found: FAKE'));
    mockFetchHistory.mockResolvedValue([]);

    render(<CompanySpotlight window="DAY" />);

    await userEvent.type(screen.getByRole('textbox', { name: /ticker symbol/i }), 'FAKE');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByTestId('spotlight-error')).toBeInTheDocument();
    });
    expect(screen.getByTestId('spotlight-error')).toHaveTextContent(/symbol not found/i);
  });

  it('does not render a SummaryCard when the fetch fails', async () => {
    mockFetchQuote.mockRejectedValue(new Error('Network error'));

    render(<CompanySpotlight window="DAY" />);

    await userEvent.type(screen.getByRole('textbox', { name: /ticker symbol/i }), 'FAKE');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => screen.getByTestId('spotlight-error'));
    expect(screen.queryByTestId(/^summary-card-/)).not.toBeInTheDocument();
  });

  it('shows the Clear button after an error', async () => {
    mockFetchQuote.mockRejectedValue(new Error('Symbol not found: FAKE'));

    render(<CompanySpotlight window="DAY" />);

    await userEvent.type(screen.getByRole('textbox', { name: /ticker symbol/i }), 'FAKE');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByTestId('spotlight-clear-btn')).toBeInTheDocument();
    });
  });

  it('triggers a search on Enter key press', async () => {
    mockFetchQuote.mockResolvedValue(MOCK_QUOTE);
    mockFetchHistory.mockResolvedValue([]);

    render(<CompanySpotlight window="DAY" />);
    const input = screen.getByRole('textbox', { name: /ticker symbol/i });

    await userEvent.type(input, 'NVDA{Enter}');

    await waitFor(() => {
      expect(screen.getByTestId('spotlight-result')).toBeInTheDocument();
    });
  });
});

describe('CompanySpotlight — Clear button', () => {
  beforeEach(() => {
    mockFetchQuote.mockResolvedValue(MOCK_QUOTE);
    mockFetchHistory.mockResolvedValue(MOCK_HISTORY);
  });

  it('removes result and clears the input when Clear is clicked', async () => {
    render(<CompanySpotlight window="DAY" />);

    await userEvent.type(screen.getByRole('textbox', { name: /ticker symbol/i }), 'NVDA');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));
    await waitFor(() => screen.getByTestId('spotlight-result'));

    await userEvent.click(screen.getByTestId('spotlight-clear-btn'));

    expect(screen.queryByTestId('spotlight-result')).not.toBeInTheDocument();
    expect(screen.queryByTestId('spotlight-error')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /ticker symbol/i })).toHaveValue('');
  });

  it('hides the Clear button after clearing', async () => {
    render(<CompanySpotlight window="DAY" />);

    await userEvent.type(screen.getByRole('textbox', { name: /ticker symbol/i }), 'NVDA');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));
    await waitFor(() => screen.getByTestId('spotlight-clear-btn'));

    await userEvent.click(screen.getByTestId('spotlight-clear-btn'));

    expect(screen.queryByTestId('spotlight-clear-btn')).not.toBeInTheDocument();
  });
});

describe('CompanySpotlight — store isolation', () => {
  it('never writes to the Zustand market store', async () => {
    mockFetchQuote.mockResolvedValue(MOCK_QUOTE);
    mockFetchHistory.mockResolvedValue(MOCK_HISTORY);

    // Capture store state before rendering the spotlight.
    const before = storeSnapshot();

    render(<CompanySpotlight window="WEEK" />);

    await userEvent.type(screen.getByRole('textbox', { name: /ticker symbol/i }), 'NVDA');
    await userEvent.click(screen.getByRole('button', { name: /search/i }));
    await waitFor(() => screen.getByTestId('spotlight-result'));

    const after = storeSnapshot();

    // The store must be exactly as it was before — spotlight is fully isolated.
    expect(after.quoteKeys).toEqual(before.quoteKeys);
    expect(after.historyKeys).toEqual(before.historyKeys);
    expect(after.errorKeys).toEqual(before.errorKeys);
    expect(after.loadingSize).toBe(before.loadingSize);
  });
});

describe('CompanySpotlight — present in DashboardPage tree', () => {
  it('renders inside CompanyGrid (smoke check via data-testid)', async () => {
    // Dynamically import CompanyGrid to avoid pulling in useMarketData at module level.
    // This is a lightweight smoke test — full DashboardPage integration is in DashboardPage.test.tsx.
    const { CompanyGrid } = await import('../../components/dashboard/CompanyGrid');

    render(
      <CompanyGrid
        window="DAY"
        quotes={{}}
        history={{}}
        loadingSymbols={new Set()}
        errors={{}}
        onDismissError={() => undefined}
      />
    );

    expect(screen.getByTestId('company-spotlight')).toBeInTheDocument();
  });
});
