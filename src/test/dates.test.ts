import { addDays, dayLabel, dayLetter, daysBetween, isoDate, parseIso, slipDays, weekStart } from '@/lib/dates';

describe('dates', () => {
  it('round-trips iso dates in local time', () => {
    expect(isoDate(parseIso('2026-09-10'))).toBe('2026-09-10');
    expect(isoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('adds days across month ends', () => {
    expect(addDays('2026-09-28', 5)).toBe('2026-10-03');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('gives seven slip days starting on the written day', () => {
    const days = slipDays('2026-09-10');
    expect(days).toHaveLength(7);
    expect(days[0]).toBe('2026-09-10');
    expect(days[6]).toBe('2026-09-16');
  });

  it('labels days', () => {
    expect(dayLabel('2026-09-10')).toBe('Thu');
    expect(dayLetter('2026-09-13')).toBe('S');
  });

  it('counts days between', () => {
    expect(daysBetween('2026-09-10', '2026-09-17')).toBe(7);
    expect(daysBetween('2026-09-17', '2026-09-10')).toBe(-7);
  });

  it('finds the Monday of a week', () => {
    expect(weekStart('2026-09-10')).toBe('2026-09-07');
    expect(weekStart('2026-09-07')).toBe('2026-09-07');
    expect(weekStart('2026-09-13')).toBe('2026-09-07');
  });
});
