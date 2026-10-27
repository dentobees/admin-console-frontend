'use client';
// Clinics: live list (eng R7) in the sales Leads/Customers layout. Filters and
// the open drawer live in the URL (?q=&state=&view=&plan=&erp=&internal=&page=&open=)
// so Overview tiles can deep-link here and a clinic can be shared (D8).
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ClinicRow, LifecycleState, Page } from '@/lib/types';
import { apiGet, isUnavailable } from '@/lib/api';
import { formatDate, sinceLabel } from '@/lib/format';
import { STATE_DEF, STATE_ORDER } from '@/lib/lifecycle';
import { PlanTag, StatePill } from '@/components/pills';
import { ClinicDrawer } from '@/components/clinic-drawer';
import { EmptyHint, ErrorCard, SkeletonRows, UnavailableCard } from '@/components/states';
import { Icon } from '@/components/icon';

// Overview tile deep links (backend resolves the same names).
const VIEWS: Record<string, string> = {
  new_this_week: 'New signups this week',
  last_cohort: 'Last weekly cohort',
  went_dormant: 'Went dormant this week',
  new_no_whatsapp: 'New, no WhatsApp after 3 days',
  missing_from_snapshot: 'Missing from last night’s numbers',
};

const WA_LABEL: Record<ClinicRow['whatsapp'], string> = {
  live: 'Live', not_connected: 'Not connected', disconnected: 'Disconnected', other: '—',
};

function ClinicsInner() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const q = sp.get('q') ?? '';
  const state = sp.get('state') ?? '';
  const view = sp.get('view') ?? '';
  const plan = sp.get('plan') ?? '';
  const erp = sp.get('erp') ?? '';
  const internal = sp.get('internal') === '1';
  const page = Number(sp.get('page') || 1);
  const open = sp.get('open');

  const [data, setData] = useState<Page<ClinicRow> | null>(null);
  const [error, setError] = useState<'unavailable' | 'other' | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(q);
  useEffect(() => { setSearch(q); }, [q]);

  const setParams = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k); else next.set(k, v);
    }
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [sp, router, pathname]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (state) p.set('state', state);
    if (view) p.set('view', view);
    if (plan) p.set('plan', plan);
    if (erp) p.set('erp', erp);
    if (internal) p.set('internal', '1');
    p.set('page', String(page));
    return p.toString();
  }, [q, state, view, plan, erp, internal, page]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiGet<Page<ClinicRow>>(`/crm/clinics?${query}`)
      .then(setData)
      .catch((e) => setError(isUnavailable(e) ? 'unavailable' : 'other'))
      .finally(() => setLoading(false));
  }, [query]);
  useEffect(() => { load(); }, [load]);

  // Debounced search into the URL.
  useEffect(() => {
    if (search === q) return;
    const t = setTimeout(() => setParams({ q: search, page: null }), 300);
    return () => clearTimeout(t);
  }, [search, q, setParams]);

  const rows = data?.rows ?? [];
  const idx = open ? rows.findIndex((r) => r.id === open) : -1;
  const openClinic = (id: string | null) => setParams({ open: id });
  const filtered = Boolean(q || state || view || plan || erp);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="h-page" style={{ marginBottom: 4 }}>Clinics</h1>
          <p className="t-meta" style={{ margin: 0 }}>{data ? `${data.total} ${filtered ? 'matching' : 'clinics'} · live from the CRM` : 'Live from the CRM'}</p>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 260, maxWidth: '100%' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'grid' }}><Icon name="search" size={14} /></span>
          <label htmlFor="clinic-search" className="sr-only">Search clinics</label>
          <input id="clinic-search" className="input" placeholder="Search clinic or city…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 32, height: 36 }} />
        </div>
        <label className="sr-only" htmlFor="f-state">State</label>
        <select id="f-state" className="select" value={state} onChange={(e) => setParams({ state: e.target.value, page: null })} style={{ width: 'auto', height: 36, fontSize: 12.5 }}>
          <option value="">All states</option>
          {STATE_ORDER.map((s: LifecycleState) => <option key={s} value={s}>{STATE_DEF[s].label}</option>)}
        </select>
        <label className="sr-only" htmlFor="f-plan">Plan</label>
        <select id="f-plan" className="select" value={plan} onChange={(e) => setParams({ plan: e.target.value, page: null })} style={{ width: 'auto', height: 36, fontSize: 12.5 }}>
          <option value="">All plans</option>
          <option value="starter">Starter</option>
          <option value="growth">Growth</option>
        </select>
        <label className="sr-only" htmlFor="f-erp">ERP link</label>
        <select id="f-erp" className="select" value={erp} onChange={(e) => setParams({ erp: e.target.value, page: null })} style={{ width: 'auto', height: 36, fontSize: 12.5 }}>
          <option value="">ERP: any</option>
          <option value="linked">ERP-linked</option>
          <option value="not_linked">Not linked</option>
        </select>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--body)' }}>
          <input type="checkbox" checked={internal} onChange={(e) => setParams({ internal: e.target.checked ? '1' : null, page: null })} />
          Show internal clinics
        </label>
      </div>

      {view && VIEWS[view] && (
        <div style={{ marginBottom: 12 }}>
          <button className="fchip active" onClick={() => setParams({ view: null, page: null })} aria-label={`Remove filter: ${VIEWS[view]}`}>
            {VIEWS[view]} <span className="x" aria-hidden><Icon name="x" size={12} /></span>
          </button>
        </div>
      )}

      {error === 'unavailable' && <UnavailableCard onRetry={load} />}
      {error === 'other' && <ErrorCard message="Couldn’t load clinics." onRetry={load} />}

      {!error && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {loading && !data ? <SkeletonRows /> : rows.length === 0 ? (
            filtered
              ? <EmptyHint action={<button className="btn btn-secondary btn-sm" onClick={() => router.replace(pathname)}>Clear filters</button>}>No clinics match your filters.</EmptyHint>
              : <EmptyHint>No clinics have signed up yet.</EmptyHint>
          ) : (
            <>
              {/* Desktop / tablet table */}
              <div className="tbl-scroll only-desktop">
                <table className="tbl" style={{ minWidth: 1040 }}>
                  <thead>
                    <tr>
                      <th className="rownum">#</th><th>Clinic</th><th>Signed up</th><th>State</th><th>Plan</th>
                      <th className="right">Seats</th><th>WhatsApp</th><th className="right">Replies 30d</th><th>Last engaged</th><th>ERP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c, i) => (
                      <tr key={c.id} onClick={() => openClinic(c.id)} aria-selected={open === c.id}>
                        <td className="rownum">{(page - 1) * (data?.pageSize ?? 50) + i + 1}</td>
                        <td>
                          <button className="link-reset" onClick={(e) => { e.stopPropagation(); openClinic(c.id); }} style={{ fontWeight: 500, color: 'var(--ink)' }}>{c.name}</button>
                          <div className="t-meta">{[c.city, c.country].filter(Boolean).join(', ')}{c.internal ? ' · internal' : ''}</div>
                        </td>
                        <td className="t-meta">{formatDate(c.signedUpAt)}</td>
                        <td><StatePill state={c.state} /></td>
                        <td><PlanTag plan={c.planTier} /></td>
                        <td className="right">{c.seats}</td>
                        <td>{WA_LABEL[c.whatsapp]}</td>
                        <td className="right">{c.replies30d}</td>
                        <td className="t-meta">{sinceLabel(c.lastEngagedAt)}</td>
                        <td>{c.erpLinked ? <Icon name="check" size={15} color="var(--brand-mint)" /> : <span className="t-meta">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Phone list items (D6) */}
              <ul className="only-phone" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {rows.map((c) => (
                  <li key={c.id}>
                    <button className="link-reset list-item" onClick={() => openClinic(c.id)}>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 500, color: 'var(--ink)', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                        <span className="t-meta">Last engaged {sinceLabel(c.lastEngagedAt)}</span>
                      </span>
                      <StatePill state={c.state} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {data && data.total > data.pageSize && (
        <nav aria-label="Pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
          <span className="t-meta">Showing {(page - 1) * data.pageSize + 1}–{Math.min(page * data.pageSize, data.total)} of {data.total}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setParams({ page: String(page - 1) })}>‹ Prev</button>
            <span className="t-meta">Page {page} / {pages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => setParams({ page: String(page + 1) })}>Next ›</button>
          </span>
        </nav>
      )}

      {open && (
        <ClinicDrawer
          clinicId={open}
          onClose={() => openClinic(null)}
          onPrev={idx > 0 ? () => openClinic(rows[idx - 1].id) : undefined}
          onNext={idx >= 0 && idx < rows.length - 1 ? () => openClinic(rows[idx + 1].id) : undefined}
          onChanged={load}
        />
      )}
    </div>
  );
}

export default function ClinicsPage() {
  return (
    <Suspense fallback={<p className="t-meta">Loading clinics…</p>}>
      <ClinicsInner />
    </Suspense>
  );
}
