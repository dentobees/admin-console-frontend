// Ported 1:1 from dentobees-crm/frontend/src/app/(app)/dashboard/page.tsx
// (BarChart, MiniFunnel); only the data shape is generic here.

export function BarChart({ rows }: { rows: { label: string; num: string; v: number; color: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.v));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {rows.map((r, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
            <span style={{ color: 'var(--body)' }}>{r.label}</span>
            <span className="num" style={{ color: 'var(--ink)' }}>{r.num}</span>
          </div>
          <div style={{ height: 7, background: 'var(--hairline-soft)', borderRadius: 4 }} aria-hidden>
            <div style={{ height: 7, width: `${(r.v / max) * 100}%`, background: r.color, borderRadius: 4, minWidth: r.v > 0 ? 4 : 0 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function readableOn(hex: string): string {
  const h = (hex || '').replace('#', '');
  if (h.length < 6) return '#fff';
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? '#06241B' : '#fff';
}

export function MiniFunnel({ steps }: { steps: { label: string; count: number; color: string }[] }) {
  const max = Math.max(1, ...steps.map((s) => s.count));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {steps.map((s) => {
        const w = Math.max(8, (s.count / max) * 100);
        return (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 92, fontSize: 11, color: 'var(--body)', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</span>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: `${w}%`, height: 18, background: s.color, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: readableOn(s.color), fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 11, transition: 'width .4s' }}>{s.count}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
