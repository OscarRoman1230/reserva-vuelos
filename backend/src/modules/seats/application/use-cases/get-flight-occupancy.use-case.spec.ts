import { FlightNotFoundError } from '../../domain/errors/seat-access.errors';
import { FlightReaderPort } from '../ports/flight-reader.port';
import { SeatRepositoryPort } from '../ports/seat.repository.port';
import {
  NOW,
  fixedClock,
  flightInfo,
  mockFlights,
  mockSeatRepo,
} from '../testing/mocks';
import { GetFlightOccupancyUseCase } from './get-flight-occupancy.use-case';

describe('GetFlightOccupancyUseCase', () => {
  let seats: jest.Mocked<SeatRepositoryPort>;
  let flights: jest.Mocked<FlightReaderPort>;
  let useCase: GetFlightOccupancyUseCase;

  beforeEach(() => {
    seats = mockSeatRepo();
    flights = mockFlights();
    useCase = new GetFlightOccupancyUseCase(seats, flights, fixedClock());
  });

  it('returns the counts in the shape of the flight.occupancy event', async () => {
    flights.findBookingInfo.mockResolvedValue(flightInfo());
    seats.countByStatus.mockResolvedValue({
      total: 180,
      available: 150,
      held: 10,
      reserved: 20,
    });

    await expect(useCase.execute('f1')).resolves.toEqual({
      flightId: 'f1',
      total: 180,
      available: 150,
      held: 10,
      reserved: 20,
    });
    expect(seats.countByStatus).toHaveBeenCalledWith('f1', NOW);
  });

  it('fails when the flight does not exist', async () => {
    flights.findBookingInfo.mockResolvedValue(null);
    await expect(useCase.execute('nope')).rejects.toThrow(FlightNotFoundError);
    expect(seats.countByStatus).not.toHaveBeenCalled();
  });
});
