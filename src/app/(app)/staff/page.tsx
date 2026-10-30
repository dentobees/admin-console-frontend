'use client';
// Staff (founder only): who can sign in, with which role. The backend enforces
// founder-only too; removing or deactivating someone deletes their sessions.
import { useCallback, useEffect, useState } from 'react';
import type { StaffRole, StaffRow } from '@/lib/types';
import { apiGet, apiSend, ApiError } from '@/lib/api';
import { useSession } from '@/lib/session';
import { EmptyHint, ErrorCard, SkeletonRows } from '@/components/states';

const ROLES: { value: StaffRole; label: string; hint: string }[] = [
  { value: 'viewer', label: 'Viewer', hint: 'Sees everything, no controls' },
  { value: 'admin', label: 'Admin', hint: 'Sees everything, uses controls' },
  { value: 'founder', label: 'Founder', hint: 'Everything, plus staff' },
];

export default function StaffPage() {
  const { user } = useSession();
  const [rows, setRows] = useState<StaffRow[] | null>(null);
  const [error, setError] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('viewer');
  const [busy, setBusy] = useState<string | null>(null);
  const [formErr, setFormErr] = useState('');

  const load = useCallback(() => {
    setError(false);
    apiGet<StaffRow[]>('/staff').then(setRows).catch(() => setError(true));
  }, []);
  useEffect(() => { if (user?.role === 'founder') load(); }, [load, user?.role]);

  if (user?.role !== 'founder') {
    return (
      <div>
        <h1 className="h-page" style={{ marginBottom: 12 }}>Staff</h1>
        <div className="card"><EmptyHint>Only founders can manage staff.</EmptyHint></div>
      </div>
    );
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !name.trim()) { setFormErr('Enter a name and a company email.'); return; }
    setBusy('add');
    setFormErr('');
    try {
      await apiSend('POST', '/staff', { email: email.trim().toLowerCase(), name: name.trim(), role });
      setEmail(''); setName(''); setRole('viewer');
      load();
    } catch (err) {
      setFormErr(`Couldn’t add: ${err instanceof ApiError ? err.message : 'network error'}.`);
    } finally {
      setBusy(null);
    }
  }

  async function update(id: string, patch: Partial<Pick<StaffRow, 'role' | 'active'>>) {
    setBusy(id);
    try {
      await apiSend('PATCH', `/staff/${id}`, patch);
      load();
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 className="h-page" style={{ marginBottom: 4 }}>Staff</h1>
        <p className="t-meta" style={{ margin: 0 }}>People who can sign in to DentoBees Admin. Set a new member's password on the server with admin-api set-password</p>
      </div>

      <form onSubmit={add} className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 180px' }}>
          <label className="field-label" htmlFor="s-name">Name</label>
          <input id="s-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div style={{ flex: '2 1 240px' }}>
          <label className="field-label" htmlFor="s-email">Company email</label>
          <input id="s-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@dentobees.com" />
        </div>
        <div style={{ flex: '1 1 160px' }}>
          <label className="field-label" htmlFor="s-role">Role</label>
          <select id="s-role" className="select" value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label} · {r.hint}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" disabled={busy === 'add'}>{busy === 'add' ? 'Adding…' : 'Add staff'}</button>
        {formErr && <p role="alert" style={{ color: 'var(--danger)', fontSize: 13, margin: 0, width: '100%' }}>{formErr}</p>}
      </form>

      {error ? <ErrorCard message="Couldn’t load staff." onRetry={load} /> : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {!rows ? <SkeletonRows rows={3} /> : rows.length === 0 ? <EmptyHint>No staff yet.</EmptyHint> : (
            <div className="tbl-scroll">
              <table className="tbl" style={{ minWidth: 640 }}>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {rows.map((s) => {
                    const self = s.email === user.email;
                    return (
                      <tr key={s.id} style={{ cursor: 'default' }}>
                        <td style={{ fontWeight: 500, color: 'var(--ink)' }}>{s.name}{self && <span className="t-meta"> (you)</span>}</td>
                        <td>{s.email}</td>
                        <td>
                          <label className="sr-only" htmlFor={`role-${s.id}`}>Role for {s.name}</label>
                          <select id={`role-${s.id}`} className="select" value={s.role} disabled={self || busy === s.id}
                            onChange={(e) => void update(s.id, { role: e.target.value as StaffRole })} style={{ width: 'auto', height: 32, fontSize: 12.5, padding: '4px 8px' }}>
                            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                        </td>
                        <td>{s.active ? 'Active' : <span className="t-meta">Removed</span>}</td>
                        <td style={{ textAlign: 'right' }}>
                          {!self && (
                            <button className="btn btn-ghost btn-sm" disabled={busy === s.id} onClick={() => void update(s.id, { active: !s.active })}>
                              {s.active ? 'Remove access' : 'Restore access'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
