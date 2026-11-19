import { DomainError } from '@kernel/domain/domain.error';

export class SeatNotFoundError extends DomainError {
  readonly code = 'SEAT_NOT_FOUND';
  constructor(seatId: string) {
    super(`Seat ${seatId} was not found`);
  }
}

export class FlightNotFoundError extends DomainError {
  readonly code = 'FLIGHT_NOT_FOUND';
  constructor(flightId: string) {
    super(`Flight ${flightId} was not found`);
  }
}

export class FlightNotBookableError extends DomainError {
  readonly code = 'FLIGHT_NOT_BOOKABLE';
  constructor(flightId: string, status: string) {
    super(`Flight ${flightId} does not accept bookings (status: ${status})`);
  }
}
