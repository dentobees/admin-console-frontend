import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

// The spy only records calls; promises come from a plain function (README "Test note").
const apiGet = vi.fn();
vi.mock('@/lib/api', () => ({
  apiGet: (p: string) => { apiGet(p); return Promise.resolve({ rows: [], total: 0, page: 1, pageSize: 50 }); },
  apiSend: () => new Promise(() => {}),
  ApiError: class extends Error {},
  isUnavailable: () => false,
}));
let role = 'viewer';
vi.mock('@/lib/session', () => ({ useSession: () => ({ user: { role } }) }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/clinics',
  useSearchParams: () => new URLSearchParams(''),
}));

import ClinicsPage from './page';

describe('Clinics "New account" button', () => {
  beforeEach(() => { apiGet.mockClear(); });

  // protects=a Viewer never sees the create button; fails_when=role viewer renders "New account"; no_claim=server-side 403 for a Viewer's direct POST (admin-api part)
  it('is hidden from a viewer', async () => {
    role = 'viewer';
    render(<ClinicsPage />);
    await screen.findByText('No clinics have signed up yet.');
    expect(screen.queryByRole('button', { name: 'New account' })).not.toBeInTheDocument();
  });

  // protects=founder and admin can open the form from the header; fails_when=either role has no button or the click opens nothing; no_claim=layout at 375/768/1280 (checked in Chrome)
  it.each(['founder', 'admin'])('shows it to %s and opens the modal', async (r) => {
    role = r;
    render(<ClinicsPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'New account' }));
    expect(screen.getByRole('dialog', { name: 'New account' })).toBeInTheDocument();
  });
});
