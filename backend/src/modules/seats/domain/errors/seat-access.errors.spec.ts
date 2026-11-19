import { DomainError } from '@kernel/domain/domain.error';
import {
  FlightNotBookableError,
  FlightNotFoundError,
  SeatNotFoundError,
} from './seat-access.errors';

describe('Seat access errors', () => {
  it.each([
    [new SeatNotFoundError('s1'), 'SEAT_NOT_FOUND', 'SeatNotFoundError'],
    [new FlightNotFoundError('f1'), 'FLIGHT_NOT_FOUND', 'FlightNotFoundError'],
    [
      new FlightNotBookableError('f1', 'CANCELLED'),
      'FLIGHT_NOT_BOOKABLE',
      'FlightNotBookableError',
    ],
  ])('%s exposes a stable code and name', (error, code, name) => {
    expect(error).toBeInstanceOf(DomainError);
    expect(error.code).toBe(code);
    expect(error.name).toBe(name);
    expect(error.message.length).toBeGreaterThan(0);
  });

  it('includes the flight status in the not-bookable message', () => {
    expect(new FlightNotBookableError('f1', 'CANCELLED').message).toContain(
      'CANCELLED',
    );
  });
});
