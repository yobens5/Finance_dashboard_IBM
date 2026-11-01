// ─── ErrorBanner ────────────────────────────────────────────────────────────

interface Props {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: Props) {
  return (
    <div
      role="alert"
      style={{
        background: '#fff1f1',
        border: '1px solid #fa4d56',
        borderRadius: 6,
        padding: '8px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 13,
        color: '#a2191f',
      }}
    >
      <span>⚠ {message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss error"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a2191f' }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
