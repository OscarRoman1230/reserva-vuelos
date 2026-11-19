import { DomainError } from '@kernel/domain/domain.error';

export class SeatNotAvailableError extends DomainError {
  readonly code = 'SEAT_NOT_AVAILABLE';
  constructor(seatId: string) {
    super(`Seat ${seatId} is not available`);
  }
}

export class SeatAlreadyReservedError extends DomainError {
  readonly code = 'SEAT_ALREADY_RESERVED';
  constructor(seatId: string) {
    super(`Seat ${seatId} is already reserved`);
  }
}

export class SeatNotHeldByUserError extends DomainError {
  readonly code = 'SEAT_NOT_HELD_BY_USER';
  constructor(seatId: string, userId: string) {
    super(`Seat ${seatId} is not held by user ${userId}`);
  }
}

export class HoldExpiredError extends DomainError {
  readonly code = 'HOLD_EXPIRED';
  constructor(seatId: string) {
    super(`The hold on seat ${seatId} has expired`);
  }
}

export class InvalidHoldDurationError extends DomainError {
  readonly code = 'INVALID_HOLD_DURATION';
  constructor(seconds: number) {
    super(
      `Hold duration must be an integer between ${1} and ${3600} seconds, received ${seconds}`,
    );
  }
}
