'use client';
// The sales CRM login card (dentobees-crm/frontend/src/app/login/page.tsx):
// work email + password. Passwords are set on the server (admin-api set-password).
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { useSession } from '@/lib/session';

const BACKDROP: React.CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  background: 'var(--brand-charcoal)',
  backgroundImage:
    'radial-gradient(circle at 18% 12%, rgba(0,209,152,.14), transparent 38%), radial-gradient(circle at 85% 90%, rgba(0,209,152,.08), transparent 42%)',
  padding: 24,
};

function message(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Sign-in failed, try again.';
  if (err.status === 401) return 'Wrong email or password.';
  if (err.status === 400) return 'Use your @dentobees.com email.';
  if (err.status === 429) return 'Too many wrong passwords. Try again in 15 minutes.';
  return 'Sign-in failed, try again.';
}

export default function LoginPage() {
  const { user, loading, login } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/overview');
  }, [user, loading, router]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      router.replace('/overview');
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={BACKDROP}>
      <main>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 18 }}>
          <span aria-hidden style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--brand-mint)', display: 'grid', placeItems: 'center', fontSize: 16 }}>🦷</span>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 20, color: '#fff', letterSpacing: '-.01em' }}>dentobees</span>
        </div>

        <div className="card" style={{ width: 380, maxWidth: 'calc(100vw - 48px)', padding: 28, background: '#fff' }}>
          <h1 className="h-sec" style={{ textAlign: 'center' }}>Sign in to DentoBees Admin</h1>
          <p className="t-meta" style={{ textAlign: 'center', margin: '6px 0 22px' }}>Staff only</p>
          {note && (
            <div style={{ display: 'flex', gap: 9, background: 'var(--mint-tint-2)', border: '1px solid #B9F0DF', borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 12.5, color: 'var(--body)' }}>{note}</div>
          )}
          <form onSubmit={onLogin}>
            <label className="field-label" htmlFor="login-email">Work email</label>
            <input id="login-email" className="input" type="email" value={email} autoFocus required autoComplete="username"
              onChange={(e) => setEmail(e.target.value)} placeholder="you@dentobees.com" />
            <div style={{ height: 14 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="field-label" htmlFor="login-password" style={{ margin: 0 }}>Password</label>
              <button type="button" onClick={() => setNote('Ask a founder to set a new password for you.')}
                style={{ background: 'none', border: 0, padding: 0, fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 12.5, color: 'var(--brand-mint)', cursor: 'pointer' }}>Forgot password?</button>
            </div>
            <input id="login-password" className="input" type="password" value={password} required autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)} />
            {error && <p role="alert" style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{error}</p>}
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 18 }} disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 22, fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,.4)' }}>
          DentoBees Admin · internal tool
        </div>
      </main>
    </div>
  );
}
