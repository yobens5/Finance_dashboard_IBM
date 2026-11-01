#!/usr/bin/env node
/**
 * Step C smoke test — Yahoo Finance adapter (yahoo-finance2 v4)
 *
 * v4 requires class instantiation: `new YahooFinance()`.
 * Exercises quote() and chart() — historical() is deprecated in v4.
 *
 * Usage:
 *   node scripts/smokeYahoo.mjs
 *   node scripts/smokeYahoo.mjs MSFT ORCL   # optional symbol override
 */

import { default as YahooFinance } from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

const SYMBOLS = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : ['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM'];

// ── helpers ────────────────────────────────────────────────────────────────

function isoDate(d) {
  return d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10);
}

function assertNumber(val, label) {
  if (typeof val !== 'number' || isNaN(val)) {
    throw new Error(`${label}: expected number, got ${JSON.stringify(val)}`);
  }
}

// ── quote smoke ────────────────────────────────────────────────────────────

async function smokeQuote(symbol) {
  const q = await yf.quote(symbol);
  if (!q) throw new Error(`quote(${symbol}): null result`);

  const price = q.regularMarketPrice ?? 0;
  const change = q.regularMarketChange ?? 0;
  const prevClose = q.regularMarketPreviousClose ?? 0;
  assertNumber(price, `quote[${symbol}].regularMarketPrice`);
  assertNumber(prevClose, `quote[${symbol}].regularMarketPreviousClose`);

  console.log(
    `  ✓ quote   ${symbol.padEnd(4)}` +
    `  price=$${price.toFixed(2)}` +
    `  change=${change >= 0 ? '+' : ''}${change.toFixed(2)}` +
    `  name="${q.shortName ?? q.longName ?? '—'}"`
  );
}

// ── historical smoke ───────────────────────────────────────────────────────

async function smokeHistory(symbol) {
  const now = new Date();
  const period1 = new Date(now);
  period1.setDate(now.getDate() - 90);

  // chart() is the v4 replacement for the deprecated historical()
  const result = await yf.chart(symbol, {
    period1: period1.toISOString().slice(0, 10),
    period2: now.toISOString().slice(0, 10),
    interval: '1d',
  });

  const quotes = result?.quotes ?? [];
  if (!Array.isArray(quotes) || quotes.length === 0) {
    throw new Error(`chart(${symbol}).quotes: empty array`);
  }

  const first = quotes[0];
  const close = Number(first.close) || Number(first.adjclose) || 0;
  assertNumber(close, `chart[${symbol}].quotes[0].close`);

  console.log(
    `  ✓ history ${symbol.padEnd(4)}` +
    `  ${quotes.length} days` +
    `  first=${isoDate(first.date)}  close=$${close.toFixed(2)}`
  );
}

// ── main ──────────────────────────────────────────────────────────────────

let failures = 0;

console.log('\nSmoke testing Yahoo Finance adapter (yahoo-finance2 v4)...\n');

for (const sym of SYMBOLS) {
  try {
    await smokeQuote(sym);
  } catch (err) {
    console.error(`  ✗ quote   ${sym.padEnd(4)}  ${err.message}`);
    failures++;
  }
  try {
    await smokeHistory(sym);
  } catch (err) {
    console.error(`  ✗ history ${sym.padEnd(4)}  ${err.message}`);
    failures++;
  }
}

console.log('');
if (failures === 0) {
  console.log('ALL CHECKS PASSED ✓\n');
} else {
  console.error(`${failures} CHECK(S) FAILED ✗\n`);
  process.exit(1);
}
