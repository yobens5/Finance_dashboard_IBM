// ─── TabBar ─────────────────────────────────────────────────────────────────

import type { TimeWindow } from '../../services/finance/types';
import { TIME_WINDOW_LABELS } from '../../services/config';

interface Props {
  active: TimeWindow;
  onChange: (w: TimeWindow) => void;
}

const WINDOWS: TimeWindow[] = ['DAY', 'WEEK', 'QUARTER'];

export function TabBar({ active, onChange }: Props) {
  return (
    <nav
      role="tablist"
      aria-label="Time window"
      style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e0e0e0', marginBottom: 24 }}
    >
      {WINDOWS.map((w) => {
        const isActive = w === active;
        return (
          <button
            key={w}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(w)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: isActive ? 700 : 400,
              fontSize: 14,
              color: isActive ? '#1192e8' : '#525252',
              borderBottom: isActive ? '3px solid #1192e8' : '3px solid transparent',
              marginBottom: -2,
              transition: 'color 0.15s',
            }}
          >
            {TIME_WINDOW_LABELS[w]}
          </button>
        );
      })}
    </nav>
  );
}
