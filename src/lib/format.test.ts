import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatPaise, sinceLabel } from './format';

describe('formatPaise', () => {
  it('converts integer paise to rupees with Indian grouping', () => {
    expect(formatPaise(1_842_000)).toBe('₹18,420');
    expect(formatPaise(12_345_678_00)).toBe('₹1,23,45,678');
    expect(formatPaise(0)).toBe('₹0');
  });
});

describe('sinceLabel (IST days)', () => {
  afterEach(() => vi.useRealTimers());

  it('counts IST calendar days, not 24-hour windows', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-26T00:30:00+05:30')); // 00:30 IST
    expect(sinceLabel('2026-10-25T23:50:00+05:30')).toBe('yesterday'); // 40 minutes ago, previous IST day
    expect(sinceLabel('2026-10-26T00:10:00+05:30')).toBe('today');
    expect(sinceLabel('2026-10-20T12:00:00+05:30')).toBe('6d ago');
    expect(sinceLabel(null)).toBe('—');
  });
});
