import type { LifecycleState } from '@/lib/types';
import { STATE_DEF } from '@/lib/lifecycle';

/** Lifecycle state in the sales CRM's .stage-pill (dot + tint). */
export function StatePill({ state }: { state: LifecycleState }) {
  const d = STATE_DEF[state];
  return (
    <span className="stage-pill" style={{ background: d.bg, color: d.fg }}>
      <span className="dot" style={{ background: d.dot }} />
      {d.label}
    </span>
  );
}

/** Read-only plan tier, styled like the sales CRM's SourceTag. */
export function PlanTag({ plan }: { plan: string }) {
  return <span className="source-tag" style={{ textTransform: 'capitalize' }}>{plan}</span>;
}
