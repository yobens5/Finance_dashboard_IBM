// ─── CompanyGrid ─────────────────────────────────────────────────────────────
// Maps over configured companies and renders the appropriate view.

import { COMPANIES, COMPANY_COLORS } from '../../services/config';
import type { HistoricalPoint, Quote, TimeWindow } from '../../services/finance/types';
import { CompanyChart } from './CompanyChart';
import { SummaryCard } from './SummaryCard';

interface Props {
  window: TimeWindow;
  quotes: Record<string, Quote>;
  history: Record<string, Partial<Record<TimeWindow, HistoricalPoint[]>>>;
  loadingSymbols: Set<string>;
  errors: Record<string, string>;
  onDismissError: (symbol: string) => void;
}

export function CompanyGrid({ window, quotes, history, loadingSymbols, errors, onDismissError }: Props) {
  return (
    <div>
      {/* Summary cards — always shown */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        {COMPANIES.map(({ symbol }) => (
          <SummaryCard
            key={symbol}
            symbol={symbol}
            color={COMPANY_COLORS[symbol]}
            quote={quotes[symbol]}
            isLoading={loadingSymbols.has(symbol)}
            error={errors[symbol]}
            onDismissError={() => onDismissError(symbol)}
          />
        ))}
      </div>

      {/* Charts — only for WEEK and QUARTER */}
      {window !== 'DAY' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {COMPANIES.map(({ symbol }) => (
            <CompanyChart
              key={symbol}
              symbol={symbol}
              color={COMPANY_COLORS[symbol]}
              window={window}
              history={history[symbol]?.[window]}
              isLoading={loadingSymbols.has(`${symbol}-${window}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
