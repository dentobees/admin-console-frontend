'use client';
// Shell ported from dentobees-crm/frontend/src/app/(app)/layout.tsx: same dark
// 224px sidebar, 58px topbar with pill search, user chip. Admin differences
// (design review): admin nav items, CRM product switcher in the "Founder · whole
// team" dropdown style, ☰ drawer under 1024px (D6), real links + landmarks (D7).
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/lib/session';
import { MOCK } from '@/lib/api';
import { NavIcon } from '@/components/nav-icons';
import { Icon } from '@/components/icon';

const NAV = [
  { href: '/overview', label: 'Overview', icon: 'overview' },
  { href: '/clinics', label: 'Clinics', icon: 'clinics' },
  { href: '/users', label: 'CRM Users', icon: 'users' },
  { href: '/audit', label: 'Audit log', icon: 'audit' },
  { href: '/staff', label: 'Staff', icon: 'staff', founderOnly: true },
];

const PRODUCTS = [
  { key: 'crm', label: 'CRM', live: true },
  { key: 'erp', label: 'ERP', live: false },
  { key: 'lab', label: 'Lab', live: false },
];

function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [productMenu, setProductMenu] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // Close the mobile nav on navigation and on Esc.
  useEffect(() => { setNavOpen(false); }, [pathname]);
  useEffect(() => {
    if (!navOpen && !productMenu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setNavOpen(false); setProductMenu(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen, productMenu]);

  if (!user) return null;
  const nav = NAV.filter((n) => !n.founderOnly || user.role === 'founder');

  return (
    <div className="admin-shell">
      <div className={`admin-drawer-scrim${navOpen ? ' is-open' : ''}`} onClick={() => setNavOpen(false)} />
      {/* Dark sidebar */}
      <aside className={`admin-sidebar${navOpen ? ' is-open' : ''}`} aria-label="Main">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '20px 18px 18px' }}>
          <span aria-hidden style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--brand-mint)', display: 'grid', placeItems: 'center', color: '#06241B', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15 }}>🦷</span>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 17, color: '#fff', letterSpacing: '-.01em' }}>dentobees</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 10.5, color: '#A1A1AA', letterSpacing: '.04em' }}>ADMIN</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: '4px 12px', flex: 1, overflowY: 'auto' }}>
          {nav.map((n) => {
            const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
            return (
              <Link key={n.href} href={n.href} aria-current={active ? 'page' : undefined} style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', borderRadius: 8,
                fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 13.5,
                color: active ? 'var(--brand-mint)' : '#A1A1AA',
                background: active ? 'rgba(255,255,255,.07)' : 'transparent',
                transition: 'background .12s, color .12s',
              }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.color = '#E4E4E7'; e.currentTarget.style.background = 'rgba(255,255,255,.04)'; } }}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.color = '#A1A1AA'; e.currentTarget.style.background = 'transparent'; } }}
              >
                <NavIcon name={n.icon} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        {/* User chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <span className="avatar" aria-hidden style={{ background: user.color, width: 30, height: 30, fontSize: 11 }}>{user.initials}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 13, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ fontSize: 11, color: '#A1A1AA', textTransform: 'capitalize' }}>{user.role}</div>
          </div>
          <button onClick={() => void logout().then(() => router.replace('/login'))} aria-label="Sign out" title="Sign out" style={{ background: 'none', border: 'none', color: '#A1A1AA', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <NavIcon name="logout" />
          </button>
        </div>
      </aside>

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{ minHeight: 58, borderBottom: '1px solid var(--hairline)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 14, padding: '0 24px', position: 'sticky', top: 0, zIndex: 10 }}>
          <button className="admin-menu-btn btn btn-ghost btn-icon" aria-label="Open menu" aria-expanded={navOpen} onClick={() => setNavOpen(true)}>
            <NavIcon name="menu" />
          </button>
          <form role="search" className={`admin-topbar-search${searchOpen ? ' is-open' : ''}`}
            onSubmit={(e) => { e.preventDefault(); router.push(`/clinics?q=${encodeURIComponent(search)}`); setSearchOpen(false); }}
            style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', display: 'grid', placeItems: 'center' }}><NavIcon name="search" /></span>
            <label htmlFor="admin-search" className="sr-only">Search clinics, users, emails</label>
            <input id="admin-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clinics, users, emails…"
              style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink)', background: 'var(--page)', border: '1px solid var(--hairline)', borderRadius: 999, padding: '9px 14px 9px 38px' }} />
          </form>
          <button className="only-phone btn btn-ghost btn-icon" aria-label="Search" onClick={() => setSearchOpen(true)}>
            <NavIcon name="search" />
          </button>
          <div style={{ flex: 1 }} />
          {/* Product switcher, in the sales "Founder · whole team" dropdown style */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setProductMenu((v) => !v)} aria-haspopup="menu" aria-expanded={productMenu}
              style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--hairline)', background: 'var(--surface)', borderRadius: 6, padding: '6px 11px', fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 12.5, color: 'var(--body)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <Icon name="dashboard" size={14} color="var(--muted)" />
              CRM
              <Icon name="chevD" size={13} color="var(--muted)" />
            </button>
            {productMenu && (
              <>
                <div onClick={() => setProductMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div role="menu" className="card" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50, width: 210, padding: 6, boxShadow: 'var(--shadow-pop)' }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 12, color: 'var(--muted)', padding: '6px 10px 4px' }}>Product</div>
                  {PRODUCTS.map((p) => (
                    <button key={p.key} role="menuitem" disabled={!p.live} onClick={() => setProductMenu(false)}
                      style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, padding: '6px 11px', border: 'none', borderRadius: 6, background: p.live ? 'var(--mint-tint-2)' : 'transparent', cursor: p.live ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 12.5, color: p.live ? 'var(--ink)' : 'var(--muted)' }}>
                      <span style={{ flex: 1, textAlign: 'left' }}>{p.label}</span>
                      {p.live ? <Icon name="check" size={14} color="var(--brand-mint)" /> : <span className="t-meta" style={{ fontSize: 11 }}>coming soon</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <span className="avatar" aria-hidden style={{ background: user.color, width: 30, height: 30, fontSize: 11 }}>{user.initials}</span>
        </header>
        {MOCK && (
          <div role="status" style={{ background: 'var(--warning-tint)', borderBottom: '1px solid var(--warning)', padding: '8px 24px', fontSize: 13, fontFamily: 'var(--font-head)', fontWeight: 500 }}>
            Fixture data · not connected to the CRM database
          </div>
        )}
        <main id="main" className="admin-main">{children}</main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading…</div>;
  return (
    <Suspense fallback={<div style={{ padding: 40, color: 'var(--muted)' }}>Loading…</div>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
