// ─── SummaryCard component tests ───────────────────────────────────────────

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SummaryCard } from '../../components/dashboard/SummaryCard';
import type { Quote } from '../../services/finance/types';

const mockQuote: Quote = {
  symbol: 'IBM',
  companyName: 'IBM',
  price: 182.45,
  previousClose: 180.0,
  change: 2.45,
  changePercent: 1.36,
  volume: 4_500_000,
  marketCap: 164_205_000_000,
  currency: 'USD',
  timestamp: Date.now(),
};

describe('SummaryCard', () => {
  it('renders the symbol', () => {
    render(<SummaryCard symbol="IBM" color="#1192e8" quote={mockQuote} />);
    expect(screen.getByText('IBM')).toBeInTheDocument();
  });

  it('renders the formatted price', () => {
    render(<SummaryCard symbol="IBM" color="#1192e8" quote={mockQuote} />);
    expect(screen.getByText(/182\.45/)).toBeInTheDocument();
  });

  it('shows an up indicator for positive change', () => {
    render(<SummaryCard symbol="IBM" color="#1192e8" quote={mockQuote} />);
    expect(screen.getByText(/▲/)).toBeInTheDocument();
  });

  it('shows a down indicator for negative change', () => {
    const down: Quote = { ...mockQuote, change: -3.0, changePercent: -1.65 };
    render(<SummaryCard symbol="IBM" color="#1192e8" quote={down} />);
    expect(screen.getByText(/▼/)).toBeInTheDocument();
  });

  it('shows a loading spinner when isLoading and no quote', () => {
    render(<SummaryCard symbol="IBM" color="#1192e8" isLoading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error banner when error prop is set', () => {
    render(<SummaryCard symbol="IBM" color="#1192e8" error="Network error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });
});
