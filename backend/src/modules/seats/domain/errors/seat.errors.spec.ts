import {
  HoldExpiredError,
  InvalidHoldDurationError,
  SeatAlreadyReservedError,
  SeatNotAvailableError,
  SeatNotHeldByUserError,
} from './seat.errors';
import { DomainError } from '@kernel/domain/domain.error';

describe('Seat domain errors', () => {
  it.each([
    [
      new SeatNotAvailableError('s1'),
      'SEAT_NOT_AVAILABLE',
      'SeatNotAvailableError',
    ],
    [
      new SeatAlreadyReservedError('s1'),
      'SEAT_ALREADY_RESERVED',
      'SeatAlreadyReservedError',
    ],
    [
      new SeatNotHeldByUserError('s1', 'u1'),
      'SEAT_NOT_HELD_BY_USER',
      'SeatNotHeldByUserError',
    ],
    [new HoldExpiredError('s1'), 'HOLD_EXPIRED', 'HoldExpiredError'],
    [
      new InvalidHoldDurationError(0),
      'INVALID_HOLD_DURATION',
      'InvalidHoldDurationError',
    ],
  ])('%s exposes a stable code and name', (error, code, name) => {
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(code);
    expect(error.name).toBe(name);
    expect(error.message.length).toBeGreaterThan(0);
  });
});
