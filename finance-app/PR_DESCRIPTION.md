# PR: feat — finance-app market dashboard (IBM + 4 competitors)

> **Branch**: `bob/feature/finance-app-initial` → `main`

---

## Summary

Delivers the complete initial implementation of the React-based finance analytics
lab application described in the SDLC workshop. The application tracks five tickers
(IBM, MSFT, ORCL, SAP, CRM) using live Yahoo Finance data and presents three
time-window views: **Current Day** (summary cards), **Last 7 Days** (line chart),
and **Last Quarter** (rebased area chart, index = 100).

A corrected CI workflow (`finance-app-ci.yml`) is included so the `validate` job
runs against the `finance-app/` subdirectory instead of the repo root.

---

## Motivation

The workshop calls for a real application that participants can evolve through
GitHub issues and pull requests, demonstrating how Bob-assisted development fits
into a standard SDLC loop. This PR establishes the verified baseline that all
future feature PRs will build on.

---

## Change Type

- [x] Initial application delivery
- [ ] Dashboard enhancement
- [ ] Data integration update
- [ ] Test / validation improvement
- [x] GitHub workflow improvement

---

## Bob Collaboration Notes

IBM Bob performed every step of this implementation:

| Phase | Bob action |
|---|---|
| **Repository analysis** | Read workshop docs, README, and CI template to derive architecture constraints |
| **Implementation** | Scaffolded all 44 source files (components, services, store, hooks, tests, scripts) |
| **yahoo-finance2 v4 research** | Discovered the class-instantiation API, deprecated `historical()`, `yf.chart()` replacement, and `suppressNotices` pattern |
| **Live smoke test** | Ran `scripts/smokeYahoo.mjs` against real Yahoo Finance; all 5 tickers returned valid prices |
| **Validation** | Iterated until `npm run typecheck`, `npm test` (34/34), and `npm run build` all passed cleanly |
| **CI fix** | Identified that the workflow lacked `working-directory: finance-app` and corrected it |
| **Diff review** | Reviewed each change for TypeScript strictness (`erasableSyntaxOnly`), Recharts v3 type constraints, and Vitest v5 async-test patterns |
| **PR description** | Generated this document following the repo PR template |

---

## Validation

All commands run from `finance-app/`:

```bash
# Install
npm ci

# Type checking (erasableSyntaxOnly, strict)
npm run typecheck     # → exit 0, no errors

# Tests — 34 tests across 5 suites
npm test
# Test Files  5 passed (5)
# Tests       34 passed (34)
# Duration    ~1 s

# Production bundle
npm run build
# ✓ 687 modules transformed
# dist/assets/index-BPXtIg1T.js  1,256.86 kB │ gzip: 349.44 kB
# ✓ built in 189ms

# Live data smoke test (requires internet access)
npm run smoke
# ALL CHECKS PASSED
# IBM   $257.81  MSFT  $521.91  ORCL  $130.67  SAP  $235.02  CRM  $229.17
```

---

## Architecture decisions

| Decision | Choice | Rationale |
|---|---|---|
| Bundler | Vite + TypeScript | Fast HMR, native ESM, first-class Vitest integration |
| Charting | Recharts v3 | Composable SVG, responsive containers, no canvas dependencies |
| State | Zustand | Minimal boilerplate; `setState` patchable in tests without providers |
| Data | yahoo-finance2 v4 class API | Only maintained free Yahoo Finance Node.js library |
| Error model | Typed `FinanceError` with code enum | Allows UI to render different messages per code without string matching |
| Test isolation | `vi.mock()` + store `setState` overrides | No network in CI; mock adapter feeds deterministic fixtures |
| Time windows | DAY / WEEK / QUARTER as `TimeWindow` union | Strongly typed; switch statements exhaustively checked by TypeScript |

---

## Feature Request Alignment

This PR delivers the full baseline application as specified in
`Github SDLC Automation/WORKSHOP-part1-BUILD.md`. No GitHub issue precedes it;
this is the initial delivery. Future feature work should:

1. File a GitHub issue describing the enhancement (e.g., "Add volume sparkline to SummaryCard")
2. Bob creates a `bob/feature/<slug>` branch
3. Bob implements, tests, commits, and opens a PR with `Closes #N` in the body
4. CI runs `validate`; maintainer reviews and merges

---

## Screenshots / Demo Notes

Run `npm run dev` from `finance-app/` to start the dev server on `http://localhost:5173`.

- **DAY tab**: five summary cards (symbol, price, Δ%, change indicator, volume)
- **WEEK tab**: five line charts per company, last 7 daily closes
- **QUARTER tab**: five area charts rebased to 100 (relative performance)
- **Mock mode**: `npm run dev:mock` uses fixture data with no network requirement

---

## Risks / Follow-Up

| Item | Detail |
|---|---|
| Bundle size | 1.26 MB uncompressed. Follow-up: code-split Recharts with `React.lazy` behind each tab |
| yahoo-finance2 rate limiting | Yahoo throttles heavy polling. Follow-up: add a 60-second client-side cache in `yahooAdapter.ts` |
| Smoke test in CI | `npm run smoke` makes live HTTP calls — not wired into CI intentionally. Follow-up: add a separate `integration` job gated on `workflow_dispatch` |
| CORS in browser | `yahoo-finance2` is Node-only; the browser bundle currently bundles it but the runtime calls will fail in a pure SPA deployment. Follow-up: extract data fetching to a thin Express/Hono API route |
| `node:url` / `node:path` externalization warnings | Vite warns that Yahoo's polyfill imports Node built-ins. Non-blocking for dev; same CORS follow-up resolves it |
