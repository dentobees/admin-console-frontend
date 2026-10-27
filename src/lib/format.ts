// Ported from dentobees-crm/frontend/src/lib/format.ts (the subset the admin uses).

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export function formatINR(n: number): string {
  return inr.format(n || 0);
}

/** Paise (integer) to ₹ with Indian grouping. */
export function formatPaise(paise: number): string {
  return formatINR(Math.round((paise || 0) / 100));
}

export function plural(n: number, word: string, suffix = 's'): string {
  return `${n} ${word}${n === 1 ? '' : suffix}`;
}

const istDate = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return istDate.format(new Date(iso));
}

/** "25 Oct" from an IST yyyy-mm-dd date (no timezone shift). */
export function formatIstDay(day: string | null): string {
  if (!day) return '—';
  return istDate.format(new Date(`${day}T12:00:00+05:30`));
}

/** "today" / "yesterday" / "6d ago" / "25 Oct" for last-engaged style columns. */
export function sinceLabel(iso: string | null): string {
  if (!iso) return '—';
  const dayMs = 86_400_000;
  const toIstDay = (t: number) => Math.floor((t + 5.5 * 3600_000) / dayMs);
  const diff = toIstDay(Date.now()) - toIstDay(new Date(iso).getTime());
  if (diff <= 0) return 'today';
  if (diff === 1) return 'yesterday';
  if (diff < 14) return `${diff}d ago`;
  return formatDate(iso);
}

export function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
