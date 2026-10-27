// Shared state pieces from the design review's state table (D3), all in the
// sales CRM's own patterns: t-meta loading line, .skel rows, a one-line hint
// inside an empty card, the warning-tint banner, and the unavailable card.

export function LoadingLine({ text }: { text: string }) {
  return <p className="t-meta" role="status">{text}</p>;
}

export function SkeletonRows({ rows = 8 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skel" style={{ height: 18, width: `${92 - (i % 3) * 14}%` }} />
      ))}
    </div>
  );
}

export function EmptyHint({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <p className="t-meta" style={{ margin: 0 }}>{children}</p>
      {action}
    </div>
  );
}

/** Live read failed because the CRM replica is unreachable (C4). */
export function UnavailableCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="card" role="alert" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <span style={{ fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 13, color: 'var(--ink)' }}>Live data temporarily unavailable.</span>
      <button className="btn btn-secondary btn-sm" onClick={onRetry}>Retry</button>
    </div>
  );
}

/** Any other load failure. */
export function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="card" role="alert" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 13, color: 'var(--danger)' }}>{message}</span>
      <button className="btn btn-secondary btn-sm" onClick={onRetry}>Retry</button>
    </div>
  );
}

/** The sales CRM's warning-tint banner (renewals banner style). */
export function WarningBanner({ children, action, tone = 'warning' }: { children: React.ReactNode; action?: React.ReactNode; tone?: 'warning' | 'neutral' }) {
  const warn = tone === 'warning';
  return (
    <div role={warn ? 'alert' : 'status'} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, marginBottom: 16,
      background: warn ? 'var(--warning-tint)' : 'var(--page)', border: `1px solid ${warn ? '#F1E2B8' : 'var(--hairline)'}`,
    }}>
      <span style={{ color: warn ? '#8A5A00' : 'var(--body)', flex: 1, fontSize: 13 }}>{children}</span>
      {action}
    </div>
  );
}
