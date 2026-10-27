/* Feather-style stroke icons, ported 1:1 from the design reference (§ icon set).
   Use <Icon name="users" size={15} color="var(--muted)" /> anywhere a single-path
   line icon is needed. The dark-sidebar nav uses its own <NavIcon>; this set covers
   the rest of the app (Settings panels, toasts, inline affordances). */

const PATHS: Record<string, string> = {
  dashboard: 'M3 3h8v8H3zM13 3h8v5h-8zM13 11h8v10h-8zM3 13h8v8H3z',
  queue: 'M4 6h16M4 12h16M4 18h10',
  pipeline: 'M3 4h5v16H3zM10 4h5v11h-5zM17 4h4v7h-4z',
  leads: 'M3 5h18M3 12h18M3 19h18',
  segments: 'M22 3H2l8 9.46V19l4 2v-8.54z',
  campaigns: 'M3 11l18-8-8 18-2-7-8-3z',
  reports: 'M3 3v18h18M7 14l3-4 3 3 5-6',
  settings:
    'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H2a2 2 0 010-4h.09A1.65 1.65 0 003.6 8a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H8a1.65 1.65 0 001-1.51V2a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V8a1.65 1.65 0 001.51 1H22a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  bell: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
  phone:
    'M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z',
  whatsapp: 'M12 2a10 10 0 00-8.6 15l-1.4 5 5.1-1.3A10 10 0 1012 2z',
  chat: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  clock: 'M12 7v5l3 2',
  check: 'M5 12l4 4L19 6',
  checkCircle: 'M12 21a9 9 0 100-18 9 9 0 000 18zM8.5 12l2.5 2.5L16 9',
  x: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  chevD: 'M6 9l6 6 6-6',
  chevR: 'M9 6l6 6-6 6',
  chevL: 'M15 6l-6 6 6 6',
  arrowR: 'M5 12h14M13 6l6 6-6 6',
  alert: 'M12 8v4M12 16h.01M12 3l9 16H3z',
  info: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v5M12 8h.01',
  rupee: 'M6 3h12M6 8h12M16 3c0 4-3 5-7 5l7 8',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  users:
    'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  calendar: 'M3 5h18v16H3zM3 9h18M8 3v4M16 3v4',
  filter: 'M22 3H2l8 9.46V19l4 2v-8.54z',
  upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 9l5-5 5 5M12 4v12',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  more: 'M12 13a1 1 0 100-2 1 1 0 000 2zM12 6a1 1 0 100-2 1 1 0 000 2zM12 20a1 1 0 100-2 1 1 0 000 2z',
  refresh: 'M21 2v6h-6M3 22v-6h6M21 8a9 9 0 00-15-3L3 8M3 16a9 9 0 0015 3l3-3',
  flag: 'M4 22V4s1-1 4-1 4 2 7 2 4-1 4-1v10s-1 1-4 1-4-2-7-2-4 1-4 1',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4z',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z',
  menu: 'M3 5h18M3 12h18M3 19h18',
  columns: 'M4 4h16v16H4zM12 4v16',
  trash: 'M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6',
  edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
};

export function Icon({
  name,
  size = 16,
  color = 'currentColor',
  sw = 2,
  fill = false,
  style,
}: {
  name: string;
  size?: number;
  color?: string;
  sw?: number;
  fill?: boolean;
  style?: React.CSSProperties;
}) {
  const d = PATHS[name] ?? PATHS.info;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? color : 'none'}
      stroke={fill ? 'none' : color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: 'none', display: 'block', ...style }}
    >
      <path d={d} />
    </svg>
  );
}
