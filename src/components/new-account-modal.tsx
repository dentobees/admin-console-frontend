'use client';
// "New account" (Clinics header, founder/admin): staff create a CRM account for
// a customer, then hand over the login details. Same modal pattern as
// control-modal.tsx (focus trap, bottom sheet on phones, overlay click closes
// unless busy). Two states in one modal: the form, then "Account created".
// The temporary password lives only in this component's state and is cleared
// when the modal closes.
import { useEffect, useRef, useState } from 'react';
import type { CreateAccountInput, CreateAccountResult } from '@/lib/types';
import { apiSend, ApiError } from '@/lib/api';
import { useFocusTrap } from '@/lib/use-focus-trap';
import { Icon } from '@/components/icon';

const COUNTRIES: { code: CreateAccountInput['phoneCountry']; dial: string }[] = [
  { code: 'IN', dial: '+91' },
  { code: 'AE', dial: '+971' },
  { code: 'SA', dial: '+966' },
  { code: 'QA', dial: '+974' },
  { code: 'GB', dial: '+44' },
  { code: 'US', dial: '+1' },
];

const DEFAULT_LOGIN_URL = 'https://app.salestrackcrm.com/login';

type FieldKey = 'ownerName' | 'email' | 'phone' | 'businessName' | 'password';
type FieldErrors = Partial<Record<FieldKey, string>>;

// Same rules as the admin-api (C.4): lengths, email shape, password >= 8.
function validate(v: { ownerName: string; email: string; phone: string; businessName: string; password: string }): FieldErrors {
  const e: FieldErrors = {};
  const name = v.ownerName.trim();
  if (name.length < 1) e.ownerName = 'Enter the owner’s name.';
  else if (name.length > 120) e.ownerName = 'Owner name can be at most 120 characters.';
  const email = v.email.trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';
  const phone = v.phone.trim();
  if (phone.length < 4 || phone.length > 20) e.phone = 'Enter the WhatsApp number, 4 to 20 characters.';
  const biz = v.businessName.trim();
  if (biz.length < 1) e.businessName = 'Enter the business name.';
  else if (biz.length > 120) e.businessName = 'Business name can be at most 120 characters.';
  if (v.password.length < 8) e.password = 'Password needs at least 8 characters.';
  else if (v.password.length > 200) e.password = 'Password can be at most 200 characters.';
  return e;
}

function loginText(loginUrl: string, email: string, password: string) {
  return [
    'Your salestrack account is ready.',
    `Sign in: ${loginUrl}`,
    `Email: ${email}`,
    `Password: ${password}`,
    'To change your password, use "Forgot password" on the sign-in page.',
  ].join('\n');
}

export function NewAccountModal({ onClose, onOpenAccount }: {
  onClose: () => void;
  /** Called with the new clinic id; the page closes the modal and opens the drawer. */
  onOpenAccount: (clinicId: string) => void;
}) {
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<CreateAccountInput['phoneCountry']>('IN');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [created, setCreated] = useState<CreateAccountResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const inFlight = useRef(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  // Closing clears everything, the temporary password included.
  function close() {
    if (busy) return;
    setPassword('');
    setShowPw(false);
    setCreated(null);
    setCopied(false);
    setCopyFailed(false);
    onClose();
  }
  const ref = useFocusTrap<HTMLDivElement>(close);

  function setField<K extends FieldKey>(key: K, set: (v: string) => void) {
    return (e: { target: { value: string } }) => {
      set(e.target.value);
      if (fieldErrors[key]) setFieldErrors((f) => ({ ...f, [key]: undefined }));
    };
  }

  async function submit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (busy || inFlight.current) return;
    const errors = validate({ ownerName, email, phone, businessName, password });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const body: CreateAccountInput = {
      ownerName: ownerName.trim(),
      email: email.trim(),
      phoneCountry,
      phone: phone.trim(),
      businessName: businessName.trim(),
      password,
    };
    inFlight.current = true;
    setBusy(true);
    setErr('');
    try {
      const result = await apiSend<CreateAccountResult>('POST', '/crm/accounts', body);
      setCreated(result);
    } catch (x) {
      setErr(`Couldn’t create the account: ${x instanceof ApiError ? x.message : 'network error'}`);
    }
    inFlight.current = false;
    setBusy(false);
  }

  async function copy() {
    if (!created) return;
    const loginUrl = process.env.NEXT_PUBLIC_CRM_LOGIN_URL || DEFAULT_LOGIN_URL;
    try {
      await navigator.clipboard.writeText(loginText(loginUrl, created.email, password));
    } catch {
      setCopyFailed(true);
      return;
    }
    setCopyFailed(false);
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  }

  function openAccount() {
    if (!created) return;
    const id = created.clinicId;
    setPassword('');
    setCreated(null);
    onOpenAccount(id);
  }

  const fieldErr = (key: FieldKey) => fieldErrors[key]
    ? <p id={`na-${key}-err`} style={{ color: 'var(--danger)', fontSize: 12.5, margin: '6px 0 0' }}>{fieldErrors[key]}</p>
    : null;
  const described = (key: FieldKey) => (fieldErrors[key] ? { 'aria-invalid': true, 'aria-describedby': `na-${key}-err` } : {});

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 130, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={close} style={{ position: 'absolute', inset: 0, background: 'rgba(24,24,27,.4)' }} />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="new-account-title" className="sheet-on-phone"
        style={{ position: 'relative', background: 'var(--surface)', borderRadius: 14, boxShadow: 'var(--shadow-pop)', padding: 24, width: 440, maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 id="new-account-title" className="h-sec" style={{ fontSize: 16 }}>{created ? 'Account created' : 'New account'}</h2>
          <button className="btn btn-icon btn-ghost" onClick={close} disabled={busy} aria-label="Close"><Icon name="x" size={18} /></button>
        </div>

        {created ? (
          <>
            <p className="t-meta" style={{ margin: '0 0 14px', lineHeight: 1.5 }}>{created.clinicName} is ready. Send the customer their login details.</p>
            {copyFailed && (
              <>
                <p role="alert" style={{ color: 'var(--danger)', fontSize: 13, margin: '0 0 8px' }}>Couldn’t copy. Select the text below and copy it.</p>
                <textarea className="textarea" readOnly rows={5} aria-label="Login details"
                  value={loginText(process.env.NEXT_PUBLIC_CRM_LOGIN_URL || DEFAULT_LOGIN_URL, created.email, password)} />
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary btn-sm" onClick={copy}>{copied ? 'Copied' : 'Copy login details'}</button>
              <button className="btn btn-primary btn-sm" onClick={openAccount}>Open account</button>
            </div>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="field-label" htmlFor="na-owner">Owner name</label>
                <input id="na-owner" className="input" value={ownerName} onChange={setField('ownerName', setOwnerName)} autoComplete="off" {...described('ownerName')} />
                {fieldErr('ownerName')}
              </div>
              <div>
                <label className="field-label" htmlFor="na-email">Email</label>
                <input id="na-email" className="input" type="email" value={email} onChange={setField('email', setEmail)} autoComplete="off" {...described('email')} />
                {fieldErr('email')}
              </div>
              <div>
                <label className="field-label" htmlFor="na-phone">WhatsApp number</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select className="select" aria-label="Country code" value={phoneCountry} onChange={(e) => setPhoneCountry(e.target.value as CreateAccountInput['phoneCountry'])} style={{ width: 'auto', flex: 'none' }}>
                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.code} {c.dial}</option>)}
                  </select>
                  <input id="na-phone" className="input" type="tel" inputMode="tel" value={phone} onChange={setField('phone', setPhone)} autoComplete="off" {...described('phone')} />
                </div>
                {fieldErr('phone')}
              </div>
              <div>
                <label className="field-label" htmlFor="na-business">Business name</label>
                <input id="na-business" className="input" value={businessName} onChange={setField('businessName', setBusinessName)} autoComplete="off" {...described('businessName')} />
                {fieldErr('businessName')}
              </div>
              <div>
                <label className="field-label" htmlFor="na-password">Temporary password</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input id="na-password" className="input" type={showPw ? 'text' : 'password'} value={password} onChange={setField('password', setPassword)} autoComplete="new-password" {...described('password')} />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPw((s) => !s)} aria-pressed={showPw} style={{ flex: 'none' }}>{showPw ? 'Hide' : 'Show'}</button>
                </div>
                {fieldErr('password')}
                <p className="t-meta" style={{ margin: '6px 0 0' }}>At least 8 characters. Share it with the customer.</p>
              </div>
            </div>
            {err && <p role="alert" style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{err}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={close} disabled={busy}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
