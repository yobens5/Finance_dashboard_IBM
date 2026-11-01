// ─── SummaryCard ─────────────────────────────────────────────────────────────
// Presentational component — renders a single company quote tile.

import type { Quote } from '../../services/finance/types';
import { ErrorBanner } from '../common/ErrorBanner';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface Props {
  symbol: string;
  color: string;
  quote?: Quote;
  isLoading?: boolean;
  error?: string;
  onDismissError?: () => void;
}

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtLarge(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}

export function SummaryCard({ symbol, color, quote, isLoading, error, onDismissError }: Props) {
  const isUp = (quote?.change ?? 0) >= 0;

  return (
    <div
      data-testid={`summary-card-${symbol}`}
      style={{
        background: '#fff',
        borderRadius: 8,
        border: `2px solid ${color}`,
        padding: '16px 20px',
        minWidth: 180,
        flex: '1 1 180px',
        boxShadow: '0 1px 4px rgba(0,0,0,.08)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color }}>{symbol}</span>
        {quote && (
          <span style={{ fontSize: 11, color: '#6f6f6f' }}>
            {new Date(quote.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {isLoading && !quote && <LoadingSpinner size={24} label="Loading…" />}
      {error && <ErrorBanner message={error} onDismiss={onDismissError} />}

      {quote && (
        <>
          <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
            ${fmt(quote.price)}
          </div>
          <div style={{ fontSize: 13, color: isUp ? '#24a148' : '#da1e28', fontWeight: 600 }}>
            {isUp ? '▲' : '▼'} {fmt(Math.abs(quote.change))} ({fmt(Math.abs(quote.changePercent))}%)
          </div>
          <div style={{ fontSize: 11, color: '#6f6f6f', marginTop: 8 }}>
            <div>Vol: {(quote.volume / 1e6).toFixed(2)}M</div>
            {quote.marketCap && <div>Mkt Cap: {fmtLarge(quote.marketCap)}</div>}
          </div>
        </>
      )}
    </div>
  );
}
