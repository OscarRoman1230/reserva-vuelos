import { SeatRepositoryPort } from '../ports/seat.repository.port';
import { NOW, fixedClock, mockEvents, mockSeatRepo } from '../testing/mocks';
import { ExpireHoldsUseCase } from './expire-holds.use-case';

describe('ExpireHoldsUseCase', () => {
  let seats: jest.Mocked<SeatRepositoryPort>;
  let events: ReturnType<typeof mockEvents>;
  let useCase: ExpireHoldsUseCase;

  beforeEach(() => {
    seats = mockSeatRepo();
    events = mockEvents();
    useCase = new ExpireHoldsUseCase(seats, events, fixedClock());
  });

  it('releases expired holds as of the clock and publishes one event per seat', async () => {
    seats.releaseExpired.mockResolvedValue([
      { seatId: 's1', flightId: 'f1' },
      { seatId: 's2', flightId: 'f2' },
    ]);

    await expect(useCase.execute()).resolves.toBe(2);

    expect(seats.releaseExpired).toHaveBeenCalledWith(NOW);
    expect(events.seatReleased).toHaveBeenCalledWith({
      flightId: 'f1',
      seatId: 's1',
      reason: 'EXPIRED',
    });
    expect(events.seatReleased).toHaveBeenCalledWith({
      flightId: 'f2',
      seatId: 's2',
      reason: 'EXPIRED',
    });
  });

  it('does nothing when there is nothing to expire', async () => {
    seats.releaseExpired.mockResolvedValue([]);
    await expect(useCase.execute()).resolves.toBe(0);
    expect(events.seatReleased).not.toHaveBeenCalled();
  });
});
