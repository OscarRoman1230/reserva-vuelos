import { InvalidHoldDurationError } from '../errors/seat.errors';
import { HoldDuration } from './hold-duration';

describe('HoldDuration', () => {
  it.each([1, 300, 3600])('accepts %d seconds', (s) => {
    expect(HoldDuration.fromSeconds(s).seconds).toBe(s);
  });

  it.each([0, -5, 3601, 1.5, NaN, Infinity])('rejects %p', (s) => {
    expect(() => HoldDuration.fromSeconds(s)).toThrow(InvalidHoldDurationError);
  });

  it('computes the expiration from a given instant', () => {
    const now = new Date('2026-11-18T10:00:00.000Z');
    const expires = HoldDuration.fromSeconds(300).expiresFrom(now);
    expect(expires.toISOString()).toBe('2026-11-18T10:05:00.000Z');
  });

  it('does not mutate the received date', () => {
    const now = new Date('2026-11-18T10:00:00.000Z');
    HoldDuration.fromSeconds(60).expiresFrom(now);
    expect(now.toISOString()).toBe('2026-11-18T10:00:00.000Z');
  });
});
