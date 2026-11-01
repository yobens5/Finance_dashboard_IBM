// ─── EmptyState ─────────────────────────────────────────────────────────────

interface Props {
  message?: string;
}

export function EmptyState({ message = 'No data available.' }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 20px',
        color: '#6f6f6f',
        fontSize: 14,
      }}
    >
      {message}
    </div>
  );
}
