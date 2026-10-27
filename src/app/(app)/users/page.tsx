'use client';
// CRM Users (eng R7): live list of every CRM user across clinics. Reads only
// users + memberships on the backend; never lead or patient data.
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { CrmUserRow, Page } from '@/lib/types';
import { apiGet, isUnavailable } from '@/lib/api';
import { sinceLabel } from '@/lib/format';
import { EmptyHint, ErrorCard, SkeletonRows, UnavailableCard } from '@/components/states';
import { Icon } from '@/components/icon';

const STATUS_STYLE: Record<CrmUserRow['membershipStatus'], React.CSSProperties> = {
  active: { background: 'var(--mint-tint-2)', color: '#067052' },
  invited: { background: 'var(--warning-tint)', color: '#8A5A00' },
  removed: { background: 'var(--hairline-soft)', color: 'var(--muted)' },
};

export default function UsersPage() {
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<CrmUserRow> | null>(null);
  const [error, setError] = useState<'unavailable' | 'other' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setQuery(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const p = new URLSearchParams({ page: String(page) });
    if (query) p.set('q', query);
    apiGet<Page<CrmUserRow>>(`/crm/users?${p}`)
      .then(setData)
      .catch((e) => setError(isUnavailable(e) ? 'unavailable' : 'other'))
      .finally(() => setLoading(false));
  }, [query, page]);
  useEffect(() => { load(); }, [load]);

  const rows = data?.rows ?? [];
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 className="h-page" style={{ marginBottom: 4 }}>CRM Users</h1>
        <p className="t-meta" style={{ margin: 0 }}>{data ? `${data.total} people across all clinics · live` : 'Everyone using the CRM, across all clinics'}</p>
      </div>

      <div style={{ position: 'relative', width: 300, maxWidth: '100%', marginBottom: 14 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'grid' }}><Icon name="search" size={14} /></span>
        <label htmlFor="user-search" className="sr-only">Search users by name or email</label>
        <input id="user-search" className="input" placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 32, height: 36 }} />
      </div>

      {error === 'unavailable' && <UnavailableCard onRetry={load} />}
      {error === 'other' && <ErrorCard message="Couldn’t load CRM users." onRetry={load} />}

      {!error && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {loading && !data ? <SkeletonRows /> : rows.length === 0 ? (
            <EmptyHint>{query ? `No users match “${query}”.` : 'No CRM users yet.'}</EmptyHint>
          ) : (
            <>
              <div className="tbl-scroll only-desktop">
                <table className="tbl" style={{ minWidth: 860 }}>
                  <thead><tr><th>Name</th><th>Email</th><th>Clinic</th><th>Role</th><th>Status</th><th>Last login</th></tr></thead>
                  <tbody>
                    {rows.map((u) => (
                      <tr key={u.id} style={{ cursor: 'default' }}>
                        <td style={{ fontWeight: 500, color: 'var(--ink)' }}>{u.name}</td>
                        <td>{u.email}</td>
                        <td><Link href={`/clinics?open=${u.clinicId}`} style={{ color: 'var(--ink)', textDecoration: 'underline', textDecorationColor: 'var(--hairline)', textUnderlineOffset: 3 }}>{u.clinicName}</Link></td>
                        <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                        <td><span className="label-pill" style={{ ...STATUS_STYLE[u.membershipStatus], textTransform: 'capitalize' }}>{u.membershipStatus}</span></td>
                        <td className="t-meta">{sinceLabel(u.lastLoginAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="only-phone" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {rows.map((u) => (
                  <li key={u.id}>
                    <Link className="list-item" href={`/clinics?open=${u.clinicId}`}>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 500, color: 'var(--ink)', fontSize: 14 }}>{u.name}</span>
                        <span className="t-meta" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email} · {u.clinicName}</span>
                      </span>
                      <span className="t-meta">{sinceLabel(u.lastLoginAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
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
