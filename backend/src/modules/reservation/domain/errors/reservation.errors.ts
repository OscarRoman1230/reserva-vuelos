import { DomainError } from '@kernel/domain/domain.error';

export class InvalidReservationCodeError extends DomainError {
  readonly code = 'INVALID_RESERVATION_CODE';
  constructor(raw: string) {
    super(`"${raw}" is not a valid reservation code`);
  }
}

export class InvalidReservationError extends DomainError {
  readonly code = 'INVALID_RESERVATION';
  constructor(reason: string) {
    super(`Invalid reservation: ${reason}`);
  }
}

export class ReservationNotFoundError extends DomainError {
  readonly code = 'RESERVATION_NOT_FOUND';
  constructor(code: string) {
    super(`Reservation ${code} was not found`);
  }
}

export class PaymentDeclinedError extends DomainError {
  readonly code = 'PAYMENT_DECLINED';
  constructor(reason: string) {
    super(`Payment declined: ${reason}`);
  }
}
