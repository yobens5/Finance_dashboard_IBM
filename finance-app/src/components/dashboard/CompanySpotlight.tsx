// ─── CompanySpotlight ────────────────────────────────────────────────────────
// Lets the user look up any ticker symbol and see a SummaryCard (always) plus a
// CompanyChart (WEEK / QUARTER tabs only). Completely isolated from the fixed
// five-company grid: uses local hook state, never touches the Zustand store.

import { useState } from 'react';
import type { TimeWindow } from '../../services/finance/types';
import { useCompanySearch } from '../../hooks/useCompanySearch';
import { SummaryCard } from './SummaryCard';
import { CompanyChart } from './CompanyChart';
import { LoadingSpinner } from '../common/LoadingSpinner';

// Neutral accent used for the searched company (not part of the fixed palette).
const SPOTLIGHT_COLOR = '#8d8d8d';

interface Props {
  window: TimeWindow;
}

export function CompanySpotlight({ window }: Props) {
  const [input, setInput] = useState('');
  const { quote, history, isLoading, error, search, reset } = useCompanySearch(window);

  const hasResult = quote !== null || error !== null;

  function handleSearch() {
    const sym = input.trim();
    if (sym) search(sym);
  }

  function handleClear() {
    reset();
    setInput('');
  }

  return (
    <section
      aria-label="Company spotlight"
      data-testid="company-spotlight"
      style={{
        marginTop: 40,
        borderTop: '2px dashed #e0e0e0',
        paddingTop: 24,
      }}
    >
      {/* ── Section heading ─────────────────────────────────────────── */}
      <h2
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: '#525252',
          marginBottom: 16,
          letterSpacing: '0.01em',
        }}
      >
        Spotlight — search any ticker
      </h2>

      {/* ── Search controls ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          data-testid="spotlight-input"
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="e.g. NVDA"
          aria-label="Ticker symbol"
          style={{
            padding: '8px 12px',
            fontSize: 14,
            border: '1px solid #c6c6c6',
            borderRadius: 4,
            width: 140,
            textTransform: 'uppercase',
          }}
        />
        <button
          data-testid="spotlight-search-btn"
          onClick={handleSearch}
          style={{
            padding: '8px 16px',
            background: '#1192e8',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Search
        </button>
        {hasResult && (
          <button
            data-testid="spotlight-clear-btn"
            onClick={handleClear}
            style={{
              padding: '8px 12px',
              background: 'none',
              border: '1px solid #c6c6c6',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14,
              color: '#525252',
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Loading state ─────────────────────────────────────────────── */}
      {isLoading && <LoadingSpinner label="Fetching data…" />}

      {/* ── Error state ───────────────────────────────────────────────── */}
      {!isLoading && error && (
        <p
          role="alert"
          data-testid="spotlight-error"
          style={{ color: '#da1e28', fontSize: 13, margin: 0 }}
        >
          {error}
        </p>
      )}

      {/* ── Result: SummaryCard + optional chart ──────────────────────── */}
      {!isLoading && quote && (
        <div data-testid="spotlight-result">
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <SummaryCard
              symbol={quote.symbol}
              color={SPOTLIGHT_COLOR}
              quote={quote}
            />
          </div>

          {window !== 'DAY' && (
            <CompanyChart
              symbol={quote.symbol}
              color={SPOTLIGHT_COLOR}
              window={window}
              history={history}
              isLoading={false}
            />
          )}
        </div>
      )}
    </section>
  );
}
