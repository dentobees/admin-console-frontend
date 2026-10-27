import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ClinicRow, Page } from '@/lib/types';

// The spy only records calls; see overview/page.test.tsx for why promises come
// from a plain function.
const apiGet = vi.fn();
let impl: (p: string) => Promise<unknown> = () => new Promise(() => {});
const replace = vi.fn();
let search = '';

vi.mock('@/lib/api', () => ({
  apiGet: (p: string) => { apiGet(p); return impl(p); },
  isUnavailable: (e: unknown) => (e as { status?: number })?.status === 503,
}));
vi.mock('@/lib/session', () => ({ useSession: () => ({ user: { role: 'founder' } }) }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => '/clinics',
  useSearchParams: () => new URLSearchParams(search),
}));

import ClinicsPage from './page';

const row: ClinicRow = {
  id: 'c1', name: 'Apollo Dental DSO', city: 'Bengaluru', country: 'IN', signedUpAt: '2026-09-01T10:00:00Z',
  state: 'dormant', planTier: 'growth', seats: 3, whatsapp: 'live', replies30d: 0, lastEngagedAt: '2026-10-01T10:00:00Z',
  erpLinked: true, internal: false,
};
const page = (rows: ClinicRow[]): Page<ClinicRow> => ({ rows, total: rows.length, page: 1, pageSize: 50 });

describe('Clinics page', () => {
  beforeEach(() => { apiGet.mockClear(); replace.mockClear(); search = ''; });

  it('passes URL filters (e.g. an Overview tile view) to the API', async () => {
    search = 'view=went_dormant&state=dormant';
    impl = () => Promise.resolve(page([row]));
    render(<ClinicsPage />);
    expect((await screen.findAllByText('Apollo Dental DSO')).length).toBeGreaterThan(0);
    expect(apiGet).toHaveBeenCalledWith(expect.stringContaining('view=went_dormant'));
    expect(screen.getByRole('button', { name: /Remove filter: Went dormant this week/ })).toBeInTheDocument();
  });

  it('empty with filters: offers Clear filters', async () => {
    search = 'q=zzz';
    impl = () => Promise.resolve(page([]));
    render(<ClinicsPage />);
    expect(await screen.findByText('No clinics match your filters.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });

  it('empty without filters: says no clinics yet', async () => {
    impl = () => Promise.resolve(page([]));
    render(<ClinicsPage />);
    expect(await screen.findByText('No clinics have signed up yet.')).toBeInTheDocument();
  });

  it('replica down: shows the unavailable card with Retry, never an empty table (C4)', async () => {
    impl = () => Promise.reject({ status: 503 });
    render(<ClinicsPage />);
    expect(await screen.findByText('Live data temporarily unavailable.')).toBeInTheDocument();
    expect(screen.queryByText('No clinics have signed up yet.')).not.toBeInTheDocument();
  });

  it('the clinic name is a real button (keyboard reachable) that opens the drawer via the URL (D7, D8)', async () => {
    impl = () => Promise.resolve(page([row]));
    render(<ClinicsPage />);
    const buttons = await screen.findAllByRole('button', { name: /Apollo Dental DSO/ });
    buttons[0].click();
    expect(replace).toHaveBeenCalledWith('/clinics?open=c1', { scroll: false });
  });
});
