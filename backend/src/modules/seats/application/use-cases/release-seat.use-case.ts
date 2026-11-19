import { domainErrorFrom } from '@kernel/domain/domain-error-from';
import { EventPublisherPort } from '@kernel/ports/event-publisher.port';
import { SeatNotFoundError } from '../../domain/errors/seat-access.errors';
import { SeatNotHeldByUserError } from '../../domain/errors/seat.errors';
import { SeatRepositoryPort } from '../ports/seat.repository.port';

export interface ReleaseSeatCommand {
  flightId: string;
  seatId: string;
  userId: string;
}

export class ReleaseSeatUseCase {
  constructor(
    private readonly seats: SeatRepositoryPort,
    private readonly events: EventPublisherPort,
  ) {}

  async execute(command: ReleaseSeatCommand): Promise<void> {
    const released = await this.seats.tryRelease(command);
    if (!released) throw await this.explainRejection(command);

    this.events.seatReleased({
      flightId: command.flightId,
      seatId: command.seatId,
      reason: 'RELEASED_BY_USER',
    });
  }

  private async explainRejection({
    flightId,
    seatId,
    userId,
  }: ReleaseSeatCommand) {
    const seat = await this.seats.findById(seatId);
    if (!seat || seat.flightId !== flightId)
      return new SeatNotFoundError(seatId);
    return domainErrorFrom(
      () => seat.release(userId),
      new SeatNotHeldByUserError(seatId, userId),
    );
  }
}
