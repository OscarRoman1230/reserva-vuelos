import { InvalidReservationError } from './errors/reservation.errors';
import { Reservation } from './reservation';
import { CODE, reservationProps } from '../application/testing/mocks';

describe('Reservation', () => {
  it('creates a reservation and exposes its identity', () => {
    const r = Reservation.create(reservationProps());
    expect(r.id).toBe('res-1');
    expect(r.code).toBe(CODE);
    expect(r.userId).toBe('u1');
    expect(r.flightId).toBe('f1');
    expect(r.seatId).toBe('s1');
  });

  it('returns a defensive copy from toProps', () => {
    const r = Reservation.create(reservationProps());
    const props = r.toProps();
    props.seatLabel = 'hacked';
    expect(r.toProps().seatLabel).toBe('12A');
  });

  it('accepts a zero amount', () => {
    expect(() =>
      Reservation.create(reservationProps({ amountMinor: 0 })),
    ).not.toThrow();
  });

  it.each([-1, 10.5, NaN])('rejects amount %p', (amountMinor) => {
    expect(() => Reservation.create(reservationProps({ amountMinor }))).toThrow(
      InvalidReservationError,
    );
  });

  it.each(['123', '12345', 'abcd', ''])('rejects cardLast4 %p', (cardLast4) => {
    expect(() => Reservation.create(reservationProps({ cardLast4 }))).toThrow(
      InvalidReservationError,
    );
  });
});
