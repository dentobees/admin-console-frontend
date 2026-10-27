'use client';
// Control modal in the sales CRM's modal pattern (components/mark-won-modal.tsx);
// a bottom sheet on phones (D6). Every control needs a reason (min 10 chars,
// also enforced by the backend) and is audited. Suspend shows the D10 wording.
import { useState } from 'react';
import type { ClinicAction } from '@/lib/types';
import { apiSend, ApiError } from '@/lib/api';
import { useFocusTrap } from '@/lib/use-focus-trap';
import { Icon } from '@/components/icon';

export type ControlKind = 'suspend' | 'reactivate' | 'wallet_enforcement' | 'mark_internal' | 'unmark_internal';

const COPY: Record<ControlKind, { title: string; confirm: string; busy: string; note?: string }> = {
  suspend: {
    title: 'Suspend clinic',
    confirm: 'Suspend',
    busy: 'Suspending…',
    note: 'New logins and session refreshes are blocked now. Open tabs lose access within 15 minutes. Live updates on an already-open tab and ERP-paired traffic continue until reload.',
  },
  reactivate: { title: 'Reactivate clinic', confirm: 'Reactivate', busy: 'Reactivating…', note: 'Staff at this clinic can sign in again right away.' },
  wallet_enforcement: { title: 'WhatsApp wallet billing', confirm: 'Save', busy: 'Saving…', note: 'Off: no charging. Shadow: record what would be charged, charge nothing. On: charge the ERP wallet.' },
  mark_internal: { title: 'Mark as internal', confirm: 'Mark internal', busy: 'Saving…', note: 'Internal and test clinics are left out of every number.' },
  unmark_internal: { title: 'Remove internal tag', confirm: 'Remove tag', busy: 'Saving…', note: 'This clinic will count in the numbers again from the next snapshot.' },
};

export function ControlModal({ clinicId, clinicName, kind, currentWallet, onClose, onDone }: {
  clinicId: string;
  clinicName: string;
  kind: ControlKind;
  currentWallet?: 'off' | 'shadow' | 'on';
  onClose: () => void;
  onDone: () => void;
}) {
  const copy = COPY[kind];
  const [reason, setReason] = useState('');
  const [wallet, setWallet] = useState<'off' | 'shadow' | 'on'>(currentWallet ?? 'on');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const ref = useFocusTrap<HTMLDivElement>(() => { if (!busy) onClose(); });

  async function confirm() {
    if (reason.trim().length < 10) { setErr('Write a reason of at least 10 characters.'); return; }
    if (kind === 'wallet_enforcement' && wallet === currentWallet) { setErr('Pick a different setting.'); return; }
    const body: ClinicAction = kind === 'wallet_enforcement'
      ? { action: kind, value: wallet, reason: reason.trim() }
      : { action: kind, reason: reason.trim() };
    setBusy(true);
    setErr('');
    try {
      await apiSend('POST', `/crm/clinics/${clinicId}/actions`, body);
      onDone();
    } catch (e) {
      setErr(`Couldn’t save: ${e instanceof ApiError ? e.message : 'network error'}. Nothing changed.`);
      setBusy(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 130, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={() => { if (!busy) onClose(); }} style={{ position: 'absolute', inset: 0, background: 'rgba(24,24,27,.4)' }} />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="control-title" className="sheet-on-phone"
        style={{ position: 'relative', background: 'var(--surface)', borderRadius: 14, boxShadow: 'var(--shadow-pop)', padding: 24, width: 440, maxWidth: '90vw', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h2 id="control-title" className="h-sec" style={{ fontSize: 16 }}>{copy.title}</h2>
            <div className="t-meta">{clinicName}</div>
          </div>
          <button className="btn btn-icon btn-ghost" onClick={onClose} disabled={busy} aria-label="Close"><Icon name="x" size={18} /></button>
        </div>
        {copy.note && <p className="t-meta" style={{ margin: '0 0 14px', lineHeight: 1.5 }}>{copy.note}</p>}
        {kind === 'wallet_enforcement' && (
          <div className="segmented" role="radiogroup" aria-label="Wallet billing" style={{ marginBottom: 14 }}>
            {(['off', 'shadow', 'on'] as const).map((v) => (
              <button key={v} role="radio" aria-checked={wallet === v} className={wallet === v ? 'active' : ''} onClick={() => setWallet(v)} style={{ textTransform: 'capitalize' }}>{v}</button>
            ))}
          </div>
        )}
        <label className="field-label" htmlFor="control-reason">Reason (saved in the audit log)</label>
        <textarea id="control-reason" className="textarea" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Payment overdue 45 days" />
        {err && <p role="alert" style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{err}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={confirm} disabled={busy}>{busy ? copy.busy : copy.confirm}</button>
        </div>
      </div>
    </div>
  );
}
