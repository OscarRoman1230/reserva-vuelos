import { domainErrorFrom } from '@kernel/domain/domain-error-from';
import { ClockPort } from '@kernel/ports/clock.port';
import { EventPublisherPort } from '@kernel/ports/event-publisher.port';
import {
  FlightNotBookableError,
  FlightNotFoundError,
  SeatNotFoundError,
} from '../../domain/errors/seat-access.errors';
import {
  SeatAlreadyReservedError,
  SeatNotAvailableError,
} from '../../domain/errors/seat.errors';
import { isFlightBookable } from '../../domain/flight-status';
import { SeatStatus } from '../../domain/seat-status';
import { HoldDuration } from '../../domain/value-objects/hold-duration';
import { FlightReaderPort } from '../ports/flight-reader.port';
import { HoldPolicyPort } from '../ports/hold-policy.port';
import { SeatRepositoryPort } from '../ports/seat.repository.port';

export interface HoldSeatCommand {
  flightId: string;
  seatId: string;
  userId: string;
}

export interface HoldSeatResult {
  flightId: string;
  seatId: string;
  expiresAt: Date;
}

export class HoldSeatUseCase {
  constructor(
    private readonly seats: SeatRepositoryPort,
    private readonly flights: FlightReaderPort,
    private readonly holdPolicy: HoldPolicyPort,
    private readonly events: EventPublisherPort,
    private readonly clock: ClockPort,
  ) {}

  async execute(command: HoldSeatCommand): Promise<HoldSeatResult> {
    const { flightId, seatId, userId } = command;

    const flight = await this.flights.findBookingInfo(flightId);
    if (!flight) throw new FlightNotFoundError(flightId);
    if (!isFlightBookable(flight.status)) {
      throw new FlightNotBookableError(flightId, flight.status);
    }

    const duration = await this.holdPolicy.getHoldDuration();
    const now = this.clock.now();
    const expiresAt = duration.expiresFrom(now);

    // Camino caliente: un único UPDATE atómico. Aquí se evita el double booking.
    const held = await this.seats.tryHold({
      seatId,
      flightId,
      userId,
      now,
      expiresAt,
    });
    if (!held) throw await this.explainRejection(command, now, duration);

    // El bloqueo ya está confirmado en DB: ahora sí se notifica.
    this.events.seatHeld({
      flightId,
      seatId,
      expiresAt: expiresAt.toISOString(),
    });
    await this.releasePreviousHolds(command);

    return { flightId, seatId, expiresAt };
  }

  /** Un usuario mantiene un solo bloqueo activo por vuelo. */
  private async releasePreviousHolds({
    userId,
    flightId,
    seatId,
  }: HoldSeatCommand): Promise<void> {
    const releasedIds = await this.seats.releaseOtherHolds(
      userId,
      flightId,
      seatId,
    );
    for (const releasedId of releasedIds) {
      this.events.seatReleased({
        flightId,
        seatId: releasedId,
        reason: 'RELEASED_BY_USER',
      });
    }
  }

  private async explainRejection(
    { flightId, seatId, userId }: HoldSeatCommand,
    now: Date,
    duration: HoldDuration,
  ) {
    const seat = await this.seats.findById(seatId);
    if (!seat || seat.flightId !== flightId)
      return new SeatNotFoundError(seatId);
    if (seat.status === SeatStatus.RESERVED)
      return new SeatAlreadyReservedError(seatId);
    return domainErrorFrom(
      () => seat.hold(userId, now, duration),
      new SeatNotAvailableError(seatId), // se liberó justo después de perder la carrera
    );
  }
}
