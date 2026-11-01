// ─── CompanyChart ─────────────────────────────────────────────────────────────
// Presentational chart wrapper. Renders a Recharts LineChart or AreaChart.

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { HistoricalPoint, TimeWindow } from '../../services/finance/types';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface Props {
  symbol: string;
  color: string;
  window: TimeWindow;
  history?: HistoricalPoint[];
  isLoading?: boolean;
}

function tickLabel(date: string, window: TimeWindow) {
  const d = new Date(date);
  if (window === 'WEEK') return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function CompanyChart({ symbol, color, window, history, isLoading }: Props) {
  if (isLoading) return <LoadingSpinner label={`Loading ${symbol}…`} />;
  if (!history || history.length === 0) return <EmptyState message={`No history for ${symbol}`} />;

  const dataKey = window === 'QUARTER' ? 'rebased' : 'close';
  const yLabel = window === 'QUARTER' ? 'Rebased (100)' : 'Price (USD)';

  const chartData = history.map((p) => ({
    ...p,
    label: tickLabel(p.date, window),
  }));

  return (
    <div
      data-testid={`company-chart-${symbol}`}
      style={{ background: '#fff', borderRadius: 8, padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}
    >
      <div style={{ fontWeight: 700, fontSize: 13, color, marginBottom: 8 }}>{symbol}</div>
      <ResponsiveContainer width="100%" height={180}>
        {window === 'QUARTER' ? (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 9, fill: '#6f6f6f' }} />
            <Tooltip formatter={(v) => (typeof v === 'number' ? v.toFixed(2) : String(v))} />
            <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#grad-${symbol})`} dot={false} strokeWidth={2} />
          </AreaChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
            <Tooltip formatter={(v) => (typeof v === 'number' ? `$${v.toFixed(2)}` : String(v))} />
            <Line type="monotone" dataKey={dataKey} stroke={color} dot={false} strokeWidth={2} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
