import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// The spy only records calls; promises come from a plain function (README "Test note").
const apiGet = vi.fn();
let impl: () => Promise<unknown> = () => new Promise(() => {});
vi.mock('@/lib/api', () => ({
  apiGet: (p: string) => { apiGet(p); return impl(); },
  isUnavailable: (e: unknown) => (e as { status?: number })?.status === 503,
}));
vi.mock('@/lib/session', () => ({ useSession: () => ({ user: { role: 'founder' } }) }));

import { ClinicDrawer } from './clinic-drawer';

const detail = {
  id: 'c99', name: 'Smile Studio', city: null, country: 'IN', signedUpAt: '2026-11-27T10:00:00Z', state: 'new', planTier: 'starter',
  seats: 1, whatsapp: 'not_connected', replies30d: 0, lastEngagedAt: null, erpLinked: false, internal: false,
  status: 'active', walletEnforcement: 'off', tags: [], phone: null, email: 'meera@smile.example',
  milestones: [], engaged90d: [], members: [], channels: [], suggestedErpClinicId: null,
};

function renderDrawer(retryNotFound: boolean) {
  render(<ClinicDrawer clinicId="c99" onClose={vi.fn()} onChanged={vi.fn()} retryNotFound={retryNotFound} />);
}

describe('ClinicDrawer after creating an account', () => {
  beforeEach(() => { apiGet.mockClear(); });

  // protects=a just-created clinic that is missing from the read copy for a second still opens; fails_when=the first 404 shows "Couldn't load" or no second read happens; no_claim=real replica lag (the 404 is scripted)
  it('retries a 404 once after 1 s for the just-created id', async () => {
    let calls = 0;
    impl = () => (++calls === 1 ? Promise.reject({ status: 404 }) : Promise.resolve(detail));
    renderDrawer(true);
    expect(await screen.findByRole('heading', { name: 'Smile Studio' }, { timeout: 3000 })).toBeInTheDocument();
    expect(apiGet).toHaveBeenCalledTimes(2);
  });

  // protects=an ordinary drawer open does not retry a 404; fails_when=a normal open reads twice; no_claim=anything about just-created clinics
  it('does not retry a 404 without the flag', async () => {
    impl = () => Promise.reject({ status: 404 });
    renderDrawer(false);
    expect(await screen.findByText('Couldn’t load this clinic.')).toBeInTheDocument();
    expect(apiGet).toHaveBeenCalledTimes(1);
  });

  // protects=a clinic that is still missing after the one retry ends in the error card; fails_when=it retries more than once or never shows the not-found state; no_claim=the exact 1 s timing
  it('gives up after one retry', async () => {
    impl = () => Promise.reject({ status: 404 });
    renderDrawer(true);
    expect(await screen.findByText('Couldn’t load this clinic.', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(apiGet).toHaveBeenCalledTimes(2);
  });
});
