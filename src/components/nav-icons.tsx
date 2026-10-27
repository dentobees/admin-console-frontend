// Small 18px line icons for the dark sidebar, ported from the sales CRM
// (components/nav-icons.tsx); the admin nav items reuse the same strokes.
const base = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

export function NavIcon({ name }: { name: string }) {
  switch (name) {
    case 'overview':
      return <svg {...base}><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></svg>;
    case 'clinics':
      return <svg {...base}><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M10 21v-5h4v5" /><path d="M12 8v4M10 10h4" /></svg>;
    case 'users':
      return <svg {...base}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></svg>;
    case 'audit':
      return <svg {...base}><path d="M3 3v18h18" /><path d="M7 13l3-4 3 3 4-6" /></svg>;
    case 'staff':
      return <svg {...base}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    case 'search':
      return <svg {...base}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
    case 'logout':
      return <svg {...base}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>;
    case 'menu':
      return <svg {...base}><path d="M3 6h18M3 12h18M3 18h18" /></svg>;
    default:
      return <svg {...base}><circle cx="12" cy="12" r="9" /></svg>;
  }
}
