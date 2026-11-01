// ─── AppShell ────────────────────────────────────────────────────────────────

import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function AppShell({ children }: Props) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', background: '#f4f4f4' }}>
      <header
        style={{
          background: '#161616',
          color: '#fff',
          padding: '0 24px',
          height: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '0.02em' }}>
          IBM Market Dashboard
        </span>
        <span style={{ fontSize: 12, color: '#a8a8a8', marginLeft: 8 }}>
          Finance Analytics Lab
        </span>
      </header>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
        {children}
      </main>
    </div>
  );
}
