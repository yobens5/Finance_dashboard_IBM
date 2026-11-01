// ─── DashboardPage ─────────────────────────────────────────────────────────
// The single data-aware component. Reads from the store and passes data down.

import { Component, type ErrorInfo, type ReactNode } from 'react';
import type { TimeWindow } from '../../services/finance/types';
import { useMarketStore } from '../../store/marketSlice';
import { useMarketData } from '../../hooks/useMarketData';
import { EmptyState } from '../common/EmptyState';
import { CompanyGrid } from './CompanyGrid';

// ── ErrorBoundary ─────────────────────────────────────────────────────────

interface EBState { hasError: boolean; message: string }
class PageErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false, message: '' };
  static getDerivedStateFromError(err: Error): EBState {
    return { hasError: true, message: err.message };
  }
  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('DashboardPage error:', err, info);
  }
  render() {
    if (this.state.hasError) {
      return <EmptyState message={`Dashboard error: ${this.state.message}`} />;
    }
    return this.props.children;
  }
}

// ── inner component ───────────────────────────────────────────────────────

function DashboardInner({ window }: { window: TimeWindow }) {
  const { quotes, history, isLoading, errors } = useMarketData(window);
  const loadingSymbols = useMarketStore((s) => s.loadingSymbols);
  const clearError = useMarketStore((s) => s.clearError);

  const hasAnyData = Object.keys(quotes).length > 0;

  if (!hasAnyData && !isLoading) {
    return <EmptyState message="No market data loaded. Check your network or enable mock mode." />;
  }

  return (
    <CompanyGrid
      window={window}
      quotes={quotes}
      history={history}
      loadingSymbols={loadingSymbols}
      errors={errors}
      onDismissError={clearError}
    />
  );
}

// ── exported page ─────────────────────────────────────────────────────────

interface Props {
  window: TimeWindow;
}

export function DashboardPage({ window }: Props) {
  return (
    <PageErrorBoundary>
      <DashboardInner window={window} />
    </PageErrorBoundary>
  );
}
