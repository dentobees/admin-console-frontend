import type { SnapshotInfo } from './types';
import { formatIstDay, plural } from './format';

export type OverviewBanner =
  | { kind: 'none' }
  | { kind: 'computing'; text: string }
  | { kind: 'failed'; text: string }
  | { kind: 'partial'; text: string };

/**
 * One rule for the Overview header (plan: Snapshot job → Banner, D6, D11).
 * - last night's run failed with all 4 attempts used → warning
 * - last night's run still pending/retrying          → neutral note
 * - last night's run partial                         → "N clinics missing" note
 */
export function overviewBanner(s: SnapshotInfo): OverviewBanner {
  if (!s.asOf) return { kind: 'none' }; // day-one empty state handles this
  const latest = formatIstDay(s.asOf);
  if (s.status === 'failed' && s.attemptsExhausted) {
    return { kind: 'failed', text: `Numbers last updated ${latest}. Last night’s refresh failed.` };
  }
  if (s.status === 'running' || (s.status === 'failed' && !s.attemptsExhausted)) {
    return { kind: 'computing', text: `Last night’s numbers are still being computed; showing ${latest}.` };
  }
  if (s.status === 'partial' && s.missingClinics > 0) {
    return { kind: 'partial', text: `${plural(s.missingClinics, 'clinic')} missing from last night’s numbers.` };
  }
  return { kind: 'none' };
}
