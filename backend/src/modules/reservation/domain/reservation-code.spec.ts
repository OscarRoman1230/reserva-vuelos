import { InvalidReservationCodeError } from './errors/reservation.errors';
import { ReservationCode } from './reservation-code';

describe('ReservationCode', () => {
  it('accepts a valid code', () => {
    expect(ReservationCode.parse('ABCD2345').value).toBe('ABCD2345');
  });

  it('normalizes case and surrounding whitespace', () => {
    expect(ReservationCode.parse('  abcd2345 ').value).toBe('ABCD2345');
  });

  it('exposes the value through toString', () => {
    expect(String(ReservationCode.parse('ABCD2345'))).toBe('ABCD2345');
  });

  it.each([
    ['', 'empty'],
    ['ABC', 'too short'],
    ['ABCD23456', 'too long'],
    ['ABCD234I', 'ambiguous letter I'],
    ['ABCD234O', 'ambiguous letter O'],
    ['ABCD2340', 'ambiguous digit 0'],
    ['ABCD2341', 'ambiguous digit 1'],
    ['ABCD-234', 'symbol'],
  ])('rejects %p (%s)', (raw) => {
    expect(() => ReservationCode.parse(raw)).toThrow(
      InvalidReservationCodeError,
    );
  });
});
