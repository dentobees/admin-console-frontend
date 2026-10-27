'use client';
// Audit log: every admin action, newest first, filterable by clinic, staff and action.
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { AuditRow, Page } from '@/lib/types';
import { apiGet } from '@/lib/api';
import { relativeTime } from '@/lib/format';
import { EmptyHint, ErrorCard, SkeletonRows } from '@/components/states';

const ACTIONS: Record<string, string> = {
  suspend: 'Suspended',
  reactivate: 'Reactivated',
  wallet_enforcement: 'Wallet billing changed',
  mark_internal: 'Marked internal',
  unmark_internal: 'Internal tag removed',
  staff_add: 'Staff added',
  staff_update: 'Staff changed',
};

const istDateTime = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });

export default function AuditPage() {
  const [action, setAction] = useState('');
  const [clinic, setClinic] = useState('');
  const [staff, setStaff] = useState('');
  const [filters, setFilters] = useState({ clinic: '', staff: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<AuditRow> | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setFilters({ clinic: clinic.trim(), staff: staff.trim() }); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [clinic, staff]);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    const p = new URLSearchParams({ page: String(page) });
    if (action) p.set('action', action);
    if (filters.clinic) p.set('clinic', filters.clinic);
    if (filters.staff) p.set('staff', filters.staff);
    apiGet<Page<AuditRow>>(`/audit?${p}`)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [action, filters, page]);
  useEffect(() => { load(); }, [load]);

  const rows = data?.rows ?? [];
  const filtered = Boolean(action || filters.clinic || filters.staff);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 className="h-page" style={{ marginBottom: 4 }}>Audit log</h1>
        <p className="t-meta" style={{ margin: 0 }}>Every admin action, newest first</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <label className="sr-only" htmlFor="a-clinic">Clinic</label>
        <input id="a-clinic" className="input" placeholder="Clinic name…" value={clinic} onChange={(e) => setClinic(e.target.value)} style={{ width: 200, height: 36 }} />
        <label className="sr-only" htmlFor="a-staff">Staff</label>
        <input id="a-staff" className="input" placeholder="Staff name or email…" value={staff} onChange={(e) => setStaff(e.target.value)} style={{ width: 200, height: 36 }} />
        <label className="sr-only" htmlFor="a-action">Action</label>
        <select id="a-action" className="select" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} style={{ width: 'auto', height: 36, fontSize: 12.5 }}>
          <option value="">All actions</option>
          {Object.entries(ACTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {error ? <ErrorCard message="Couldn’t load the audit log." onRetry={load} /> : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {loading && !data ? <SkeletonRows /> : rows.length === 0 ? (
            <EmptyHint>{filtered ? 'No actions match these filters.' : 'No admin actions yet. Suspend, wallet and internal-tag changes appear here.'}</EmptyHint>
          ) : (
            <div className="tbl-scroll">
              <table className="tbl" style={{ minWidth: 820 }}>
                <thead><tr><th>When</th><th>Staff</th><th>Action</th><th>Clinic</th><th>Change</th><th>Reason</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} style={{ cursor: 'default' }}>
                      <td title={istDateTime.format(new Date(r.at))} className="t-meta" style={{ whiteSpace: 'nowrap' }}>{relativeTime(r.at)}</td>
                      <td style={{ color: 'var(--ink)', fontWeight: 500 }}>{r.actorName}</td>
                      <td>{ACTIONS[r.action] ?? r.action}</td>
                      <td>{r.clinicId ? <Link href={`/clinics?open=${r.clinicId}`} style={{ textDecoration: 'underline', textDecorationColor: 'var(--hairline)', textUnderlineOffset: 3 }}>{r.clinicName}</Link> : <span className="t-meta">—</span>}</td>
                      <td style={{ whiteSpace: 'nowrap' }}><span className="t-meta">{r.before}</span> → <span style={{ color: 'var(--ink)' }}>{r.after}</span></td>
                      <td style={{ maxWidth: 280 }}>{r.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {data && data.total > data.pageSize && (
        <nav aria-label="Pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Prev</button>
          <span className="t-meta">Page {page} / {pages}</span>
          <button className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next ›</button>
        </nav>
      )}
    </div>
  );
}
