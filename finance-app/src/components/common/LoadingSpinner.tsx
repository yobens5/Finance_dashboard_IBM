// ─── LoadingSpinner ─────────────────────────────────────────────────────────

interface Props {
  size?: number;
  label?: string;
}

export function LoadingSpinner({ size = 40, label = 'Loading…' }: Props) {
  return (
    <div
      role="status"
      aria-label={label}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        style={{ animation: 'spin 1s linear infinite' }}
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#1192e8"
          strokeWidth="5"
          strokeDasharray="31.4 94.2"
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </svg>
      <span style={{ fontSize: 13, color: '#6f6f6f' }}>{label}</span>
    </div>
  );
}
