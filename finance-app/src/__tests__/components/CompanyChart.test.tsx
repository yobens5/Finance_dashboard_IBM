// ─── CompanyChart component tests ──────────────────────────────────────────
// Recharts renders SVG — we verify the wrapper div is present and
// that the loading / empty states work correctly.

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CompanyChart } from '../../components/dashboard/CompanyChart';
import type { HistoricalPoint } from '../../services/finance/types';

const history: HistoricalPoint[] = Array.from({ length: 7 }, (_, i) => ({
  date: `2024-07-0${i + 1}`,
  open: 180 + i,
  high: 185 + i,
  low: 175 + i,
  close: 182 + i,
  volume: 4_000_000,
  rebased: 100 + i,
}));

describe('CompanyChart', () => {
  it('renders the symbol label', () => {
    render(<CompanyChart symbol="IBM" color="#1192e8" window="WEEK" history={history} />);
    expect(screen.getByTestId('company-chart-IBM')).toBeInTheDocument();
    expect(screen.getByText('IBM')).toBeInTheDocument();
  });

  it('shows a loading spinner when isLoading is true', () => {
    render(<CompanyChart symbol="IBM" color="#1192e8" window="WEEK" isLoading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows empty state when no history is provided', () => {
    render(<CompanyChart symbol="IBM" color="#1192e8" window="WEEK" history={[]} />);
    expect(screen.getByText(/No history for IBM/)).toBeInTheDocument();
  });

  it('renders for QUARTER window with history', () => {
    render(<CompanyChart symbol="MSFT" color="#00b0a0" window="QUARTER" history={history} />);
    expect(screen.getByTestId('company-chart-MSFT')).toBeInTheDocument();
  });
});
