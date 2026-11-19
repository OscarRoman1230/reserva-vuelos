import {
  FlightNotBookableError,
  FlightNotFoundError,
  SeatNotFoundError,
} from '../../domain/errors/seat-access.errors';
import {
  SeatAlreadyReservedError,
  SeatNotAvailableError,
} from '../../domain/errors/seat.errors';
import { SeatStatus } from '../../domain/seat-status';
import { FlightReaderPort } from '../ports/flight-reader.port';
import { HoldPolicyPort } from '../ports/hold-policy.port';
import { SeatRepositoryPort } from '../ports/seat.repository.port';
import {
  NOW,
  fixedClock,
  flightInfo,
  heldSeat,
  makeSeat,
  mockEvents,
  mockFlights,
  mockHoldPolicy,
  mockSeatRepo,
  plusSeconds,
} from '../testing/mocks';
import { HoldSeatUseCase } from './hold-seat.use-case';

describe('HoldSeatUseCase', () => {
  const command = { flightId: 'f1', seatId: 's1', userId: 'u1' };
  let seats: jest.Mocked<SeatRepositoryPort>;
  let flights: jest.Mocked<FlightReaderPort>;
  let policy: jest.Mocked<HoldPolicyPort>;
  let events: ReturnType<typeof mockEvents>;
  let useCase: HoldSeatUseCase;

  const build = (seconds = 300) => {
    policy = mockHoldPolicy(seconds);
    useCase = new HoldSeatUseCase(seats, flights, policy, events, fixedClock());
  };

  beforeEach(() => {
    seats = mockSeatRepo();
    flights = mockFlights();
    events = mockEvents();
    flights.findBookingInfo.mockResolvedValue(flightInfo());
    build();
  });

  describe('success', () => {
    beforeEach(() => seats.tryHold.mockResolvedValue(true));

    it('holds the seat with the expiry computed from the DB policy', async () => {
      const result = await useCase.execute(command);

      expect(seats.tryHold).toHaveBeenCalledWith({
        ...command,
        now: NOW,
        expiresAt: plusSeconds(300),
      });
      expect(result).toEqual({
        flightId: 'f1',
        seatId: 's1',
        expiresAt: plusSeconds(300),
      });
    });

    it('uses the duration returned by the policy', async () => {
      build(60);
      const result = await useCase.execute(command);
      expect(result.expiresAt).toEqual(plusSeconds(60));
    });

    it('publishes seat.held without exposing the holder', async () => {
      await useCase.execute(command);

      expect(events.seatHeld).toHaveBeenCalledTimes(1);
      const payload = events.seatHeld.mock.calls[0][0];
      expect(payload).toEqual({
        flightId: 'f1',
        seatId: 's1',
        expiresAt: plusSeconds(300).toISOString(),
      });
      expect(JSON.stringify(payload)).not.toContain('u1');
    });

    it('does not publish seat.released when there were no previous holds', async () => {
      await useCase.execute(command);
      expect(seats.releaseOtherHolds).toHaveBeenCalledWith('u1', 'f1', 's1');
      expect(events.seatReleased).not.toHaveBeenCalled();
    });

    it('releases previous holds of the same user and notifies each one', async () => {
      seats.releaseOtherHolds.mockResolvedValue(['s0', 's9']);
      await useCase.execute(command);

      expect(events.seatReleased).toHaveBeenCalledTimes(2);
      expect(events.seatReleased).toHaveBeenCalledWith({
        flightId: 'f1',
        seatId: 's0',
        reason: 'RELEASED_BY_USER',
      });
      expect(events.seatReleased).toHaveBeenCalledWith({
        flightId: 'f1',
        seatId: 's9',
        reason: 'RELEASED_BY_USER',
      });
    });

    it.each(['SCHEDULED', 'DELAYED'] as const)(
      'accepts flights in %s',
      async (status) => {
        flights.findBookingInfo.mockResolvedValue(flightInfo({ status }));
        await expect(useCase.execute(command)).resolves.toBeDefined();
      },
    );
  });

  describe('flight validation', () => {
    it('fails when the flight does not exist', async () => {
      flights.findBookingInfo.mockResolvedValue(null);
      await expect(useCase.execute(command)).rejects.toThrow(
        FlightNotFoundError,
      );
      expect(seats.tryHold).not.toHaveBeenCalled();
    });

    it.each(['CANCELLED', 'SOLD_OUT'] as const)(
      'fails when the flight is %s',
      async (status) => {
        flights.findBookingInfo.mockResolvedValue(flightInfo({ status }));
        await expect(useCase.execute(command)).rejects.toThrow(
          FlightNotBookableError,
        );
        expect(seats.tryHold).not.toHaveBeenCalled();
      },
    );
  });

  describe('rejection (atomic update affected 0 rows)', () => {
    beforeEach(() => seats.tryHold.mockResolvedValue(false));

    it('SeatNotFoundError when the seat does not exist', async () => {
      seats.findById.mockResolvedValue(null);
      await expect(useCase.execute(command)).rejects.toThrow(SeatNotFoundError);
    });

    it('SeatNotFoundError when the seat belongs to another flight', async () => {
      seats.findById.mockResolvedValue(makeSeat({ flightId: 'other-flight' }));
      await expect(useCase.execute(command)).rejects.toThrow(SeatNotFoundError);
    });

    it('SeatAlreadyReservedError when the seat is RESERVED', async () => {
      seats.findById.mockResolvedValue(
        makeSeat({ status: SeatStatus.RESERVED }),
      );
      await expect(useCase.execute(command)).rejects.toThrow(
        SeatAlreadyReservedError,
      );
    });

    it('SeatNotAvailableError when another user holds it', async () => {
      seats.findById.mockResolvedValue(heldSeat('u2', plusSeconds(100)));
      await expect(useCase.execute(command)).rejects.toThrow(
        SeatNotAvailableError,
      );
    });

    it('SeatNotAvailableError when the seat was freed right after losing the race', async () => {
      seats.findById.mockResolvedValue(makeSeat());
      await expect(useCase.execute(command)).rejects.toThrow(
        SeatNotAvailableError,
      );
    });

    it('publishes nothing and does not touch other holds', async () => {
      seats.findById.mockResolvedValue(heldSeat('u2', plusSeconds(100)));
      await expect(useCase.execute(command)).rejects.toThrow();
      expect(events.seatHeld).not.toHaveBeenCalled();
      expect(events.seatReleased).not.toHaveBeenCalled();
      expect(seats.releaseOtherHolds).not.toHaveBeenCalled();
    });
  });

  it('propagates infrastructure errors untouched', async () => {
    seats.tryHold.mockRejectedValue(new Error('db down'));
    await expect(useCase.execute(command)).rejects.toThrow('db down');
    expect(events.seatHeld).not.toHaveBeenCalled();
  });
});
