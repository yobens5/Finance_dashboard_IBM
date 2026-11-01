// ─── Vitest global test setup ──────────────────────────────────────────────
// Use the dedicated vitest sub-path export so Vitest's Assertion type is
// correctly augmented with toBeInTheDocument etc.
import '@testing-library/jest-dom/vitest';
