'use client';
// Overview (design review D2): the sales dashboard layout. "This week" card
// (ActionTile style, each tile a link to the matching clinic list), one metric
// row, then Clinics-by-state bars + weekly table (D5) left, funnel right.
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { LifecycleState, Overview, TilePreview } from '@/lib/types';
import { apiGet } from '@/lib/api';
import { formatIstDay, formatPaise, plural } from '@/lib/format';
import { STATE_DEF, STATE_ORDER } from '@/lib/lifecycle';
import { overviewBanner } from '@/lib/overview-banner';
import { useSession } from '@/lib/session';
import { BarChart, MiniFunnel } from '@/components/charts';
import { ErrorCard, LoadingLine, WarningBanner } from '@/components/states';

export default function OverviewPage() {
  const { user } = useSession();
  const [o, setO] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    apiGet<Overview>('/crm/overview')
      .then(setO)
      .catch(() => setError('Couldn’t load the overview.'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const header = (sub: string) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
      <div>
        <h1 className="h-page" style={{ marginBottom: 4 }}>Overview</h1>
        <p className="t-meta" style={{ margin: 0 }}>{sub}</p>
      </div>
      <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>↻ Refresh</button>
    </div>
  );

  if (loading && !o) return <LoadingLine text="Loading overview…" />;
  if (error && !o) return <>{header('CRM')}<ErrorCard message={error} onRetry={load} /></>;
  if (!o) return null;

  // Day one: no snapshot has run yet (D3).
  if (!o.snapshot.asOf) {
    return (
      <div>
        {header('CRM')}
        <div className="card" style={{ padding: 20 }}>
          <div className="h-card" style={{ marginBottom: 6 }}>No numbers yet</div>
          <p className="t-meta" style={{ margin: 0 }}>The first snapshot runs tonight at 00:30 IST. History appears after the one-time backfill.</p>
        </div>
      </div>
    );
  }

  const banner = overviewBanner(o.snapshot);
  const totalStates = STATE_ORDER.reduce((s, k) => s + o.states[k], 0);
  const canSeeMissing = user?.role !== 'viewer';
  const pct = o.thisWeek.activation.cohort > 0 ? Math.round((o.thisWeek.activation.activated / o.thisWeek.activation.cohort) * 100) : null;

  return (
    <div>
      {header(`CRM · as of end of ${formatIstDay(o.snapshot.asOf)} IST · ${plural(o.metrics.total, 'clinic')}`)}

      {banner.kind === 'failed' && <WarningBanner>{banner.text}</WarningBanner>}
      {banner.kind === 'computing' && <WarningBanner tone="neutral">{banner.text}</WarningBanner>}
      {banner.kind === 'partial' && (
        <WarningBanner action={canSeeMissing ? <Link className="btn btn-secondary btn-sm" href="/clinics?view=missing_from_snapshot">View</Link> : undefined}>
          {banner.text}
        </WarningBanner>
      )}

      {/* This week (ActionTile card) */}
      <section aria-labelledby="this-week" className="card" style={{ padding: 20, marginBottom: 18, borderColor: o.thisWeek.wentDormant && o.thisWeek.wentDormant.count > 0 ? '#B9F0DF' : 'var(--hairline)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span aria-hidden style={{ color: 'var(--brand-mint)' }}>✦</span>
          <h2 id="this-week" className="h-card">This week</h2>
        </div>
        <div className="grid-4">
          <ActionTile label="New signups" value={String(o.thisWeek.newSignups.count)} sub={preview(o.thisWeek.newSignups)}
            variant={o.thisWeek.newSignups.count > 0 ? 'mint' : 'plain'} href="/clinics?view=new_this_week" />
          <ActionTile label="Activated (last cohort)" value={pct === null ? '—' : `${pct}%`}
            sub={o.thisWeek.activation.cohort > 0 ? `${o.thisWeek.activation.activated} of ${plural(o.thisWeek.activation.cohort, 'clinic')}` : 'no signups that week'}
            variant="plain" href="/clinics?view=last_cohort" />
          {o.thisWeek.wentDormant ? (
            <ActionTile label="Went dormant" value={String(o.thisWeek.wentDormant.count)} sub={preview(o.thisWeek.wentDormant)}
              variant={o.thisWeek.wentDormant.count > 0 ? 'danger' : 'plain'} href="/clinics?view=went_dormant" />
          ) : (
            <ActionTile label="Went dormant" value="—" sub="not enough history" variant="plain" />
          )}
          <ActionTile label="New, no WhatsApp after 3 days" value={String(o.thisWeek.newNoWhatsApp.count)} sub={preview(o.thisWeek.newNoWhatsApp)}
            variant="plain" href="/clinics?view=new_no_whatsapp" />
        </div>
      </section>

      {/* Metric row */}
      <div className="grid-4" style={{ marginBottom: 18 }}>
        <Metric label="Active clinics" value={String(o.metrics.active)} sub="staff action in last 7 days" />
        <Metric label="Total clinics" value={String(o.metrics.total)} sub="excluding internal" />
        <Metric label="Team joined" value={String(o.metrics.teamJoined)} sub="2+ active members" />
        <Metric label="WhatsApp spend this month" value={formatPaise(o.metrics.spendPaiseMonth)} sub="CRM-sent, net of refunds" />
      </div>

      {/* Main grid */}
      <div className="main-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
          <section aria-labelledby="by-state" className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 id="by-state" className="h-card">Clinics by state</h2>
              <span className="t-meta">{plural(totalStates, 'clinic')}</span>
            </div>
            <BarChart rows={STATE_ORDER.map((k: LifecycleState) => ({
              label: STATE_DEF[k].label, num: String(o.states[k]), v: o.states[k],
              color: k === 'suspended' ? 'var(--brand-charcoal)' : STATE_DEF[k].dot,
            }))} />
          </section>

          <section aria-labelledby="weeks" className="card" style={{ overflow: 'hidden' }}>
            <h2 id="weeks" className="h-card" style={{ padding: '18px 18px 8px' }}>Weekly signups vs active clinics</h2>
            <div className="tbl-scroll">
              <table className="tbl">
                <thead><tr><th>Week of</th><th className="right">New signups</th><th className="right">Active clinics</th><th></th></tr></thead>
                <tbody>
                  {o.weeks.slice().reverse().map((w) => (
                    <tr key={w.weekStart} style={{ cursor: 'default' }}>
                      <td>{formatIstDay(w.weekStart)}</td>
                      <td className="right">{w.newSignups}</td>
                      <td className="right">{w.active ?? '—'}</td>
                      <td className="t-meta" title={w.reconstructed ? 'Reconstructed from history: deleted leads/messages are missing; history follows channel moves; human lead actions before 16 Sep 2026 may be undercounted; suspension unknown for these dates.' : undefined}>
                        {w.reconstructed ? 'reconstructed' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section aria-labelledby="funnel" className="card" style={{ padding: 18 }}>
          <h2 id="funnel" className="h-card" style={{ marginBottom: 14 }}>Activation funnel</h2>
          <MiniFunnel steps={[
            { label: 'Signed up', count: o.funnel.signedUp, color: '#9CA3AF' },
            { label: 'Onboarded', count: o.funnel.onboarded, color: '#4B5563' },
            { label: 'WhatsApp live', count: o.funnel.whatsappLive, color: '#0F766E' },
            { label: 'First reply', count: o.funnel.firstReply, color: '#0EA88E' },
            { label: 'Team joined', count: o.funnel.teamJoined, color: '#00D198' },
          ]} />
        </section>
      </div>
    </div>
  );
}

function preview(t: TilePreview): string {
  if (t.count === 0 || !t.firstClinic) return '—';
  return t.count > 1 ? `${t.firstClinic} + ${t.count - 1} more` : t.firstClinic;
}

// ActionTile from the sales dashboard, rendered as a real link (D7).
function ActionTile({ label, value, sub, variant, href }: { label: string; value: string; sub: string; variant: 'mint' | 'danger' | 'plain'; href?: string }) {
  const style: React.CSSProperties =
    variant === 'mint' ? { border: '1px solid var(--brand-mint)', background: 'var(--mint-tint-2)' }
      : variant === 'danger' ? { border: '1px solid #F3D2D2', background: 'var(--danger-tint)' }
        : { border: '1px solid var(--hairline)', background: 'var(--page)' };
  const inner = (
    <>
      <div className="t-label" style={{ fontSize: 12 }}>{label}</div>
      <div className="num" style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 24, marginTop: 6, color: variant === 'danger' ? 'var(--danger)' : variant === 'mint' ? '#067052' : 'var(--ink)' }}>{value}</div>
      <div className="t-meta" style={{ marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
    </>
  );
  const box: React.CSSProperties = { ...style, borderRadius: 10, padding: '13px 15px', display: 'block', minWidth: 0 };
  return href ? <Link href={href} style={{ ...box, cursor: 'pointer' }}>{inner}</Link> : <div style={box}>{inner}</div>;
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="metric-card">
      <div className="m-label">{label}</div>
      <div className="m-num">{value}</div>
      <div className="t-meta" style={{ fontSize: 11.5, marginTop: 6 }}>{sub}</div>
    </div>
  );
}
