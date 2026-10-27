import { describe, expect, it } from 'vitest';
import { overviewBanner } from './overview-banner';
import type { SnapshotInfo } from './types';

const base: SnapshotInfo = { asOf: '2026-10-25', status: 'success', attemptsExhausted: false, missingClinics: 0 };

describe('overviewBanner (one rule for the Overview header)', () => {
  it('shows nothing on a good night', () => {
    expect(overviewBanner(base)).toEqual({ kind: 'none' });
  });

  it('defers to the day-one empty state before any snapshot exists', () => {
    expect(overviewBanner({ ...base, asOf: null, status: 'none' })).toEqual({ kind: 'none' });
  });

  it('warns only when all 4 attempts failed (D6)', () => {
    const b = overviewBanner({ ...base, status: 'failed', attemptsExhausted: true });
    expect(b.kind).toBe('failed');
    expect(b.kind !== 'none' && b.text).toContain('Last night’s refresh failed');
  });

  it('shows the neutral note while retries remain or the run is in progress', () => {
    expect(overviewBanner({ ...base, status: 'failed', attemptsExhausted: false }).kind).toBe('computing');
    expect(overviewBanner({ ...base, status: 'running' }).kind).toBe('computing');
  });

  it('reports missing clinics on a partial run (D11), with correct plural', () => {
    const one = overviewBanner({ ...base, status: 'partial', missingClinics: 1 });
    const three = overviewBanner({ ...base, status: 'partial', missingClinics: 3 });
    expect(one.kind !== 'none' && one.text).toBe('1 clinic missing from last night’s numbers.');
    expect(three.kind !== 'none' && three.text).toBe('3 clinics missing from last night’s numbers.');
  });
});
