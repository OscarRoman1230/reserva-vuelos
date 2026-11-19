import { DomainError } from '@kernel/domain/domain.error';
import {
  InvalidReservationCodeError,
  InvalidReservationError,
  PaymentDeclinedError,
  ReservationNotFoundError,
} from './reservation.errors';

describe('Reservation errors', () => {
  it.each([
    [
      new InvalidReservationCodeError('x'),
      'INVALID_RESERVATION_CODE',
      'InvalidReservationCodeError',
    ],
    [
      new InvalidReservationError('bad'),
      'INVALID_RESERVATION',
      'InvalidReservationError',
    ],
    [
      new ReservationNotFoundError('ABCD2345'),
      'RESERVATION_NOT_FOUND',
      'ReservationNotFoundError',
    ],
    [
      new PaymentDeclinedError('insufficient funds'),
      'PAYMENT_DECLINED',
      'PaymentDeclinedError',
    ],
  ])('%s exposes a stable code and name', (error, code, name) => {
    expect(error).toBeInstanceOf(DomainError);
    expect(error.code).toBe(code);
    expect(error.name).toBe(name);
    expect(error.message.length).toBeGreaterThan(0);
  });

  it('includes the reason in the payment declined message', () => {
    expect(new PaymentDeclinedError('insufficient funds').message).toContain(
      'insufficient funds',
    );
  });
});
