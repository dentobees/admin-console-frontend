import type { LifecycleState } from './types';

// Labels and pill colours for the six lifecycle states (design review: state
// pills use .stage-pill with a dot, colours from the sales CRM tokens).
export const STATE_ORDER: LifecycleState[] = ['new', 'never_activated', 'active', 'lapsing', 'dormant', 'suspended'];

export const STATE_DEF: Record<LifecycleState, { label: string; dot: string; bg: string; fg: string }> = {
  new: { label: 'New', dot: 'var(--brand-mint)', bg: 'var(--mint-tint)', fg: '#067052' },
  never_activated: { label: 'Never activated', dot: 'var(--cold)', bg: '#F1F5F9', fg: '#475569' },
  active: { label: 'Active', dot: 'var(--success)', bg: 'var(--mint-tint-2)', fg: '#067052' },
  lapsing: { label: 'Lapsing', dot: 'var(--warning)', bg: 'var(--warning-tint)', fg: '#8A5A00' },
  dormant: { label: 'Dormant', dot: 'var(--danger)', bg: 'var(--danger-tint)', fg: 'var(--danger)' },
  suspended: { label: 'Suspended', dot: 'var(--brand-charcoal)', bg: 'var(--hairline-soft)', fg: 'var(--ink)' },
};
