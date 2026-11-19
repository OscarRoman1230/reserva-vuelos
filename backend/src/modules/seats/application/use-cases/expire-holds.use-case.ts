import { ClockPort } from '@kernel/ports/clock.port';
import { EventPublisherPort } from '@kernel/ports/event-publisher.port';
import { SeatRepositoryPort } from '../ports/seat.repository.port';

/** Lo invoca el sweeper programado (bloque 5). Devuelve cuántos bloqueos liberó. */
export class ExpireHoldsUseCase {
  constructor(
    private readonly seats: SeatRepositoryPort,
    private readonly events: EventPublisherPort,
    private readonly clock: ClockPort,
  ) {}

  async execute(): Promise<number> {
    const expired = await this.seats.releaseExpired(this.clock.now());
    for (const { flightId, seatId } of expired) {
      this.events.seatReleased({ flightId, seatId, reason: 'EXPIRED' });
    }
    return expired.length;
  }
}
