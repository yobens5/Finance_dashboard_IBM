// ─── Domain types for the finance service layer ───────────────────────────

export type TimeWindow = 'DAY' | 'WEEK' | 'QUARTER';

export interface Quote {
  symbol: string;
  companyName: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number | null;
  currency: string;
  timestamp: number; // Unix ms
}

export interface HistoricalPoint {
  date: string; // ISO date string e.g. "2024-07-01"
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  /** Normalised to 100 at period start (set by transformer, not adapter) */
  rebased?: number;
}

export interface FinanceData {
  quote: Quote;
  history: HistoricalPoint[];
}

export type FinanceErrorCode =
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'NETWORK'
  | 'PARSE_ERROR'
  | 'UNKNOWN';

export class FinanceError extends Error {
  readonly code: FinanceErrorCode;
  readonly symbol?: string;

  constructor(code: FinanceErrorCode, message: string, symbol?: string) {
    super(message);
    this.name = 'FinanceError';
    this.code = code;
    this.symbol = symbol;
  }
}

export interface FinanceAdapter {
  fetchQuote(symbol: string): Promise<Quote>;
  fetchHistory(symbol: string, window: TimeWindow): Promise<HistoricalPoint[]>;
}
