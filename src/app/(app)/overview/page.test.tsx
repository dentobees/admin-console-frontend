import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Overview } from '@/lib/types';

// The spy only records calls; promises come from a plain function, because a
// vitest 2.1 spy that returns a rejected Error promise fails the test even when
// the component handles the rejection.
const calls = vi.fn();
let impl: (p: string) => Promise<unknown> = () => new Promise(() => {});
vi.mock('@/lib/api', () => ({ apiGet: (p: string) => { calls(p); return impl(p); }, MOCK: false }));
vi.mock('@/lib/session', () => ({ useSession: () => ({ user: { role: 'founder' } }) }));

import OverviewPage from './page';

function overview(patch: Partial<Overview> = {}): Overview {
  return {
    snapshot: { asOf: '2026-10-25', status: 'success', attemptsExhausted: false, missingClinics: 0 },
    thisWeek: {
      newSignups: { count: 9, firstClinic: 'Smile Studio' },
      activation: { activated: 8, cohort: 21 },
      wentDormant: { count: 5, firstClinic: 'Apollo Dental DSO' },
      newNoWhatsApp: { count: 0, firstClinic: null },
    },
    metrics: { active: 71, total: 142, teamJoined: 41, spendPaiseMonth: 1_842_000 },
    states: { new: 9, never_activated: 31, active: 71, lapsing: 14, dormant: 15, suspended: 2 },
    funnel: { signedUp: 142, onboarded: 120, whatsappLive: 88, firstReply: 74, teamJoined: 41 },
    weeks: [{ weekStart: '2026-10-19', newSignups: 9, active: 71, reconstructed: false }],
    ...patch,
  };
}

describe('Overview page', () => {
  beforeEach(() => { calls.mockClear(); impl = () => new Promise(() => {}); });

  it('day one: explains the first snapshot instead of showing zeros (D3)', async () => {
    impl = () => Promise.resolve(overview({ snapshot: { asOf: null, status: 'none', attemptsExhausted: false, missingClinics: 0 } }));
    render(<OverviewPage />);
    expect(await screen.findByText('No numbers yet')).toBeInTheDocument();
    expect(screen.getByText(/first snapshot runs tonight at 00:30 IST/)).toBeInTheDocument();
    expect(screen.queryByText('This week')).not.toBeInTheDocument();
  });

  it('This week tiles are links to the matching clinic lists (D2, D7)', async () => {
    impl = () => Promise.resolve(overview());
    render(<OverviewPage />);
    const dormant = await screen.findByRole('link', { name: /Went dormant/ });
    expect(dormant).toHaveAttribute('href', '/clinics?view=went_dormant');
    expect(dormant).toHaveTextContent('Apollo Dental DSO + 4 more');
    expect(screen.getByRole('link', { name: /New signups/ })).toHaveAttribute('href', '/clinics?view=new_this_week');
    expect(screen.getByText('38%')).toBeInTheDocument();
    expect(screen.getByText('₹18,420')).toBeInTheDocument();
  });

  it('a zero tile shows an em-less dash sub-line, not a clinic name', async () => {
    impl = () => Promise.resolve(overview());
    render(<OverviewPage />);
    const tile = await screen.findByRole('link', { name: /no WhatsApp after 3 days/ });
    expect(tile).toHaveTextContent('—');
  });

  it('says "not enough history" instead of a number when dormancy cannot be compared', async () => {
    const o = overview();
    o.thisWeek.wentDormant = null;
    impl = () => Promise.resolve(o);
    render(<OverviewPage />);
    expect(await screen.findByText('not enough history')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Went dormant/ })).not.toBeInTheDocument();
  });

  it('shows the failure warning only when all attempts are used', async () => {
    impl = () => Promise.resolve(overview({ snapshot: { asOf: '2026-10-24', status: 'failed', attemptsExhausted: true, missingClinics: 0 } }));
    render(<OverviewPage />);
    expect(await screen.findByText(/Last night’s refresh failed/)).toBeInTheDocument();
  });

  it('clinic states sum to the total in the header of the state card', async () => {
    impl = () => Promise.resolve(overview());
    render(<OverviewPage />);
    expect(await screen.findByText('142 clinics')).toBeInTheDocument();
  });

  it('shows an error card with Retry when the overview cannot load', async () => {
    impl = () => Promise.reject(new Error('boom'));
    render(<OverviewPage />);
    expect(await screen.findByText('Couldn’t load the overview.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
