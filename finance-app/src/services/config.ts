// ─── Central configuration ─────────────────────────────────────────────────

export const COMPANIES = [
  { symbol: 'IBM',  name: 'IBM' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'ORCL', name: 'Oracle' },
  { symbol: 'SAP',  name: 'SAP' },
  { symbol: 'CRM',  name: 'Salesforce' },
] as const;

export type CompanySymbol = typeof COMPANIES[number]['symbol'];

export const COMPANY_COLORS: Record<CompanySymbol, string> = {
  IBM:  '#1192e8',
  MSFT: '#00b0a0',
  ORCL: '#fa4d56',
  SAP:  '#6929c4',
  CRM:  '#ff832b',
};

export const TIME_WINDOW_LABELS = {
  DAY:     'Current Day',
  WEEK:    'Last 7 Days',
  QUARTER: 'Last Quarter',
} as const;
