'use client';
// Clinic detail (design review D8): the sales LeadDrawer container (60vw,
// min 460px, slides in from the right over the list), full width under 1024px.
// URL /clinics?open=<id>; ↑/↓ moves to the previous/next clinic in the list;
// Esc closes and returns focus (D7). Contact links per D4.
import { useCallback, useEffect, useState } from 'react';
import type { ClinicDetail } from '@/lib/types';
import { apiGet, isUnavailable } from '@/lib/api';
import { formatDate, sinceLabel } from '@/lib/format';
import { useSession } from '@/lib/session';
import { useFocusTrap } from '@/lib/use-focus-trap';
import { Icon } from '@/components/icon';
import { PlanTag, StatePill } from '@/components/pills';
import { BarChart } from '@/components/charts';
import { ControlModal, type ControlKind } from '@/components/control-modal';
import { ErrorCard, UnavailableCard } from '@/components/states';

export function ClinicDrawer({ clinicId, onClose, onPrev, onNext, onChanged }: {
  clinicId: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onChanged: () => void;
}) {
  const { user } = useSession();
  const [d, setD] = useState<ClinicDetail | null>(null);
  const [error, setError] = useState<'unavailable' | 'other' | null>(null);
  const [control, setControl] = useState<ControlKind | null>(null);
  const ref = useFocusTrap<HTMLDivElement>(() => { if (!control) onClose(); });

  const load = useCallback(() => {
    setError(null);
    setD(null);
    apiGet<ClinicDetail>(`/crm/clinics/${clinicId}`)
      .then(setD)
      .catch((e) => setError(isUnavailable(e) ? 'unavailable' : 'other'));
  }, [clinicId]);
  useEffect(() => { load(); }, [load]);

  // ↑/↓ between clinics (not while typing or while a control modal is open).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (control) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowUp' && onPrev) { e.preventDefault(); onPrev(); }
      if (e.key === 'ArrowDown' && onNext) { e.preventDefault(); onNext(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [control, onPrev, onNext]);

  const canControl = user?.role === 'founder' || user?.role === 'admin';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(24,24,27,.28)', backdropFilter: 'blur(1px)', animation: 'dt-fadeIn .15s ease' }} />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="clinic-title" className="drawer-on-phone"
        style={{ position: 'relative', width: '60vw', minWidth: 460, height: '100%', background: 'var(--surface)', boxShadow: '-10px 0 40px -12px rgba(24,24,27,.28)', display: 'flex', flexDirection: 'column', animation: 'dt-slideInRight .22s cubic-bezier(.22,.61,.36,1)' }}>
        {/* Header bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderBottom: '1px solid var(--hairline)' }}>
          <button className="btn btn-ghost btn-icon" onClick={onPrev} disabled={!onPrev} aria-label="Previous clinic"><Icon name="chevL" size={16} style={{ transform: 'rotate(90deg)' }} /></button>
          <button className="btn btn-ghost btn-icon" onClick={onNext} disabled={!onNext} aria-label="Next clinic"><Icon name="chevR" size={16} style={{ transform: 'rotate(90deg)' }} /></button>
          <span className="t-meta only-desktop" style={{ marginLeft: 4 }}>↑/↓ to move between clinics</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close" style={{ marginLeft: 'auto' }}><Icon name="x" size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {error === 'unavailable' && <UnavailableCard onRetry={load} />}
          {error === 'other' && <ErrorCard message="Couldn’t load this clinic." onRetry={load} />}
          {!d && !error && <DrawerSkeleton />}
          {d && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Identity + contact (D4) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h2 id="clinic-title" className="h-page" style={{ fontSize: 20 }}>{d.name}</h2>
                  <StatePill state={d.state} />
                  <PlanTag plan={d.planTier} />
                  {d.internal && <span className="source-tag">internal</span>}
                </div>
                <p className="t-meta" style={{ margin: '4px 0 0' }}>
                  {[d.city, d.country].filter(Boolean).join(', ')} · signed up {formatDate(d.signedUpAt)}
                </p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
                  {d.phone && <a href={`tel:${d.phone.replace(/\s+/g, '')}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 13, color: 'var(--ink)' }}><Icon name="phone" size={14} color="var(--brand-mint)" />{d.phone}</a>}
                  {d.email && <a href={`mailto:${d.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 13, color: 'var(--ink)' }}><Icon name="send" size={14} color="var(--brand-mint)" />{d.email}</a>}
                  {!d.phone && !d.email && <span className="t-meta">No clinic contact on file.</span>}
                </div>
              </div>

              {/* Controls */}
              {canControl && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {d.status === 'suspended'
                    ? <button className="btn btn-secondary btn-sm" onClick={() => setControl('reactivate')}>Reactivate</button>
                    : <button className="btn btn-secondary btn-sm" onClick={() => setControl('suspend')} style={{ color: 'var(--danger)' }}>Suspend</button>}
                  <button className="btn btn-secondary btn-sm" onClick={() => setControl('wallet_enforcement')}>Wallet billing: <span style={{ textTransform: 'capitalize' }}>{d.walletEnforcement}</span></button>
                  {d.internal
                    ? <button className="btn btn-secondary btn-sm" onClick={() => setControl('unmark_internal')}>Remove internal tag</button>
                    : <button className="btn btn-secondary btn-sm" onClick={() => setControl('mark_internal')}>Mark internal</button>}
                </div>
              )}

              {/* Milestones */}
              <section className="card" style={{ padding: 16 }}>
                <h3 className="h-card" style={{ marginBottom: 12 }}>Milestones</h3>
                <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {d.milestones.map((m) => (
                    <li key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                      <span aria-hidden style={{ width: 10, height: 10, borderRadius: '50%', flex: 'none', background: m.at ? 'var(--brand-mint)' : 'var(--surface)', border: m.at ? 'none' : '2px solid var(--hairline)' }} />
                      <span style={{ flex: 1, color: m.at ? 'var(--ink)' : 'var(--muted)' }}>{m.label}</span>
                      <span className="t-meta">{m.at ? formatDate(m.at) : 'not yet'}</span>
                    </li>
                  ))}
                </ol>
              </section>

              {/* Activity */}
              <section className="card" style={{ padding: 16 }}>
                <h3 className="h-card" style={{ marginBottom: 12 }}>Staff actions, last 90 days</h3>
                {d.engaged90d.every((w) => w.count === 0)
                  ? <p className="t-meta" style={{ margin: 0 }}>No staff actions in the last 90 days.</p>
                  : <BarChart rows={d.engaged90d.slice().reverse().slice(0, 6).map((w) => ({ label: `Week of ${formatDate(w.weekStart)}`, num: String(w.count), v: w.count, color: 'var(--brand-mint)' }))} />}
              </section>

              {/* Members */}
              <section className="card" style={{ overflow: 'hidden' }}>
                <h3 className="h-card" style={{ padding: '16px 16px 6px' }}>Team</h3>
                {d.members.length <= 1 && <p className="t-meta" style={{ margin: '0 16px 6px' }}>Only the owner so far.</p>}
                <div className="tbl-scroll">
                  <table className="tbl">
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Last login</th></tr></thead>
                    <tbody>
                      {d.members.map((m) => (
                        <tr key={m.email} style={{ cursor: 'default' }}>
                          <td style={{ color: 'var(--ink)', fontWeight: 500 }}>{m.name}</td>
                          <td>{m.email}</td>
                          <td style={{ textTransform: 'capitalize' }}>{m.role}</td>
                          <td className="t-meta">{sinceLabel(m.lastLoginAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Channels */}
              <section className="card" style={{ padding: 16 }}>
                <h3 className="h-card" style={{ marginBottom: 10 }}>WhatsApp numbers</h3>
                {d.channels.length === 0
                  ? <p className="t-meta" style={{ margin: 0 }}>No WhatsApp number connected.</p>
                  : d.channels.map((c) => (
                    <div key={c.phone} style={{ display: 'flex', gap: 12, fontSize: 13, flexWrap: 'wrap', padding: '4px 0' }}>
                      <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{c.phone}</span>
                      <span className="source-tag" style={{ textTransform: 'capitalize' }}>{c.status.replace('_', ' ')}</span>
                      {c.quality && <span className="t-meta">quality {c.quality.toLowerCase()}</span>}
                      {c.tier && <span className="t-meta">{c.tier.replace('TIER_', '').toLowerCase()} / day</span>}
                    </div>
                  ))}
              </section>

              {/* ERP */}
              <section className="card" style={{ padding: 16 }}>
                <h3 className="h-card" style={{ marginBottom: 6 }}>ERP</h3>
                <p className="t-meta" style={{ margin: 0 }}>
                  {d.suggestedErpClinicId ? `Paired with ERP clinic ${d.suggestedErpClinicId}.` : 'Not linked to an ERP clinic.'}
                </p>
              </section>
            </div>
          )}
        </div>
      </div>

      {control && d && (
        <ControlModal clinicId={d.id} clinicName={d.name} kind={control} currentWallet={d.walletEnforcement}
          onClose={() => setControl(null)}
          onDone={() => { setControl(null); load(); onChanged(); }} />
      )}
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div role="status" aria-label="Loading clinic" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="skel" style={{ height: 24, width: '55%' }} />
      <div className="skel" style={{ height: 14, width: '40%' }} />
      <div className="skel" style={{ height: 120, width: '100%' }} />
      <div className="skel" style={{ height: 120, width: '100%' }} />
    </div>
  );
}
