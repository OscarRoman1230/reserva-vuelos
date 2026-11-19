import { ClockPort } from '@kernel/ports/clock.port';
import type { FlightOccupancyEvent } from '@flights/shared';
import { FlightNotFoundError } from '../../domain/errors/seat-access.errors';
import { FlightReaderPort } from '../ports/flight-reader.port';
import { SeatRepositoryPort } from '../ports/seat.repository.port';

export class GetFlightOccupancyUseCase {
  constructor(
    private readonly seats: SeatRepositoryPort,
    private readonly flights: FlightReaderPort,
    private readonly clock: ClockPort,
  ) {}

  async execute(flightId: string): Promise<FlightOccupancyEvent> {
    const flight = await this.flights.findBookingInfo(flightId);
    if (!flight) throw new FlightNotFoundError(flightId);

    const counts = await this.seats.countByStatus(flightId, this.clock.now());
    return { flightId, ...counts };
  }
}
