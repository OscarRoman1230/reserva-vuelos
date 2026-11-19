import { SeatNotFoundError } from '../../domain/errors/seat-access.errors';
import {
  SeatAlreadyReservedError,
  SeatNotHeldByUserError,
} from '../../domain/errors/seat.errors';
import { SeatStatus } from '../../domain/seat-status';
import { SeatRepositoryPort } from '../ports/seat.repository.port';
import {
  heldSeat,
  makeSeat,
  mockEvents,
  mockSeatRepo,
  plusSeconds,
} from '../testing/mocks';
import { ReleaseSeatUseCase } from './release-seat.use-case';

describe('ReleaseSeatUseCase', () => {
  const command = { flightId: 'f1', seatId: 's1', userId: 'u1' };
  let seats: jest.Mocked<SeatRepositoryPort>;
  let events: ReturnType<typeof mockEvents>;
  let useCase: ReleaseSeatUseCase;

  beforeEach(() => {
    seats = mockSeatRepo();
    events = mockEvents();
    useCase = new ReleaseSeatUseCase(seats, events);
  });

  it('releases the own hold and publishes seat.released', async () => {
    seats.tryRelease.mockResolvedValue(true);
    await useCase.execute(command);

    expect(seats.tryRelease).toHaveBeenCalledWith(command);
    expect(events.seatReleased).toHaveBeenCalledWith({
      flightId: 'f1',
      seatId: 's1',
      reason: 'RELEASED_BY_USER',
    });
  });

  describe('rejection', () => {
    beforeEach(() => seats.tryRelease.mockResolvedValue(false));

    it('SeatNotFoundError when the seat does not exist', async () => {
      seats.findById.mockResolvedValue(null);
      await expect(useCase.execute(command)).rejects.toThrow(SeatNotFoundError);
    });

    it('SeatNotFoundError when the seat belongs to another flight', async () => {
      seats.findById.mockResolvedValue(makeSeat({ flightId: 'other' }));
      await expect(useCase.execute(command)).rejects.toThrow(SeatNotFoundError);
    });

    it('SeatNotHeldByUserError when held by someone else', async () => {
      seats.findById.mockResolvedValue(heldSeat('u2', plusSeconds(100)));
      await expect(useCase.execute(command)).rejects.toThrow(
        SeatNotHeldByUserError,
      );
    });

    it('SeatNotHeldByUserError when the seat is AVAILABLE', async () => {
      seats.findById.mockResolvedValue(makeSeat());
      await expect(useCase.execute(command)).rejects.toThrow(
        SeatNotHeldByUserError,
      );
    });

    it('SeatAlreadyReservedError when the seat is RESERVED', async () => {
      seats.findById.mockResolvedValue(
        makeSeat({ status: SeatStatus.RESERVED }),
      );
      await expect(useCase.execute(command)).rejects.toThrow(
        SeatAlreadyReservedError,
      );
    });

    it('falls back to SeatNotHeldByUserError when the hold became releasable meanwhile', async () => {
      seats.findById.mockResolvedValue(heldSeat('u1', plusSeconds(100)));
      await expect(useCase.execute(command)).rejects.toThrow(
        SeatNotHeldByUserError,
      );
    });

    it('publishes nothing', async () => {
      seats.findById.mockResolvedValue(makeSeat());
      await expect(useCase.execute(command)).rejects.toThrow();
      expect(events.seatReleased).not.toHaveBeenCalled();
    });
  });
});
