'use client';
// The sales CRM login card (dentobees-crm/frontend/src/app/login/page.tsx) with
// one "Sign in with Google" button; the backend runs the OIDC flow (D3).
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GOOGLE_START_URL, useSession } from '@/lib/session';

const BACKDROP: React.CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  background: 'var(--brand-charcoal)',
  backgroundImage:
    'radial-gradient(circle at 18% 12%, rgba(0,209,152,.14), transparent 38%), radial-gradient(circle at 85% 90%, rgba(0,209,152,.08), transparent 42%)',
  padding: 24,
};

// Error codes the backend appends as ?error=<code> after a refused callback.
const ERRORS: Record<string, string> = {
  not_staff: 'That Google account isn’t on the staff list.',
  wrong_domain: 'Use your company Google account.',
  expired: 'Sign-in expired, try again.',
  failed: 'Sign-in failed, try again.',
};

function LoginCard() {
  const { user, loading } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const error = ERRORS[params.get('error') ?? ''] ?? (params.get('error') ? ERRORS.failed : '');

  useEffect(() => {
    if (!loading && user) router.replace('/overview');
  }, [user, loading, router]);

  return (
    <div style={BACKDROP}>
      <main>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 18 }}>
          <span aria-hidden style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--brand-mint)', display: 'grid', placeItems: 'center', fontSize: 16 }}>🦷</span>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 20, color: '#fff', letterSpacing: '-.01em' }}>dentobees</span>
        </div>

        <div className="card" style={{ width: 380, maxWidth: 'calc(100vw - 48px)', padding: 28, background: '#fff' }}>
          <h1 className="h-sec" style={{ textAlign: 'center' }}>Sign in to DentoBees Admin</h1>
          <p className="t-meta" style={{ textAlign: 'center', margin: '6px 0 22px' }}>Staff only · use your company Google account</p>
          <a href={GOOGLE_START_URL} className="btn btn-primary" style={{ width: '100%' }} aria-disabled={busy} onClick={() => setBusy(true)}>
            {busy ? 'Signing in…' : 'Sign in with Google'}
          </a>
          {error && <p role="alert" style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{error}</p>}
        </div>

        <div style={{ textAlign: 'center', marginTop: 22, fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,.4)' }}>
          DentoBees Admin · internal tool
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginCard />
    </Suspense>
  );
}
