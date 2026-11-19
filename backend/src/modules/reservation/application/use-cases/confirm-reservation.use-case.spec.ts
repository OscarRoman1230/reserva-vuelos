import {
  FlightNotBookableError,
  FlightNotFoundError,
  SeatNotFoundError,
} from '@modules/seats/domain/errors/seat-access.errors';
import {
  HoldExpiredError,
  SeatAlreadyReservedError,
  SeatNotHeldByUserError,
} from '@modules/seats/domain/errors/seat.errors';
import { SeatStatus } from '@modules/seats/domain/seat-status';
import { FlightReaderPort } from '@modules/seats/application/ports/flight-reader.port';
import { SeatRepositoryPort } from '@modules/seats/application/ports/seat.repository.port';
import {
  NOW,
  fixedClock,
  flightInfo,
  heldSeat,
  makeSeat,
  mockEvents,
  mockFlights,
  mockSeatRepo,
  plusSeconds,
} from '@modules/seats/application/testing/mocks';
import { PaymentDeclinedError } from '../../domain/errors/reservation.errors';
import { PaymentPort } from '../ports/payment.port';
import { ReservationRepositoryPort } from '../ports/reservation.repository.port';
import {
  CODE,
  mockCodes,
  mockIds,
  mockPayments,
  mockReservationRepo,
  mockUow,
  validCard,
} from '../testing/mocks';
import { ConfirmReservationUseCase } from './confirm-reservation.use-case';

describe('ConfirmReservationUseCase', () => {
  const command = {
    flightId: 'f1',
    seatId: 's1',
    userId: 'u1',
    payment: validCard(),
  };
  let seats: jest.Mocked<SeatRepositoryPort>;
  let reservations: jest.Mocked<ReservationRepositoryPort>;
  let flights: jest.Mocked<FlightReaderPort>;
  let payments: jest.Mocked<PaymentPort>;
  let events: ReturnType<typeof mockEvents>;
  let uow: ReturnType<typeof mockUow>;
  let useCase: ConfirmReservationUseCase;

  beforeEach(() => {
    seats = mockSeatRepo();
    reservations = mockReservationRepo();
    flights = mockFlights();
    payments = mockPayments();
    events = mockEvents();
    uow = mockUow({ seats, reservations });
    flights.findBookingInfo.mockResolvedValue(flightInfo());
    seats.tryConfirm.mockResolvedValue({ row: 12, column: 'A' });
    useCase = new ConfirmReservationUseCase(
      uow,
      flights,
      payments,
      mockCodes(),
      mockIds(),
      events,
      fixedClock(),
    );
  });

  describe('success', () => {
    it('returns the reservation with the flight fare, seat label and card last4', async () => {
      const result = await useCase.execute(command);

      expect(result).toEqual({
        id: 'res-1',
        code: CODE,
        userId: 'u1',
        flightId: 'f1',
        seatId: 's1',
        seatLabel: '12A',
        amountMinor: 45_000_000,
        currency: 'COP',
        paymentRef: 'tx-1',
        cardLast4: '4242',
        createdAt: NOW,
      });
    });

    it('confirms the seat inside the unit of work using the clock', async () => {
      await useCase.execute(command);
      expect(uow.run).toHaveBeenCalledTimes(1);
      expect(seats.tryConfirm).toHaveBeenCalledWith({
        seatId: 's1',
        flightId: 'f1',
        userId: 'u1',
        now: NOW,
      });
    });

    it('charges the fare using the reservation id as reference', async () => {
      await useCase.execute(command);
      expect(payments.charge).toHaveBeenCalledWith({
        amountMinor: 45_000_000,
        currency: 'COP',
        card: command.payment,
        reference: 'res-1',
      });
    });

    it('persists the reservation', async () => {
      await useCase.execute(command);
      expect(reservations.insert).toHaveBeenCalledTimes(1);
      expect(reservations.insert.mock.calls[0][0].code).toBe(CODE);
    });

    it('publishes seat.reserved only AFTER the transaction completed', async () => {
      await useCase.execute(command);

      expect(events.seatReserved).toHaveBeenCalledWith({
        flightId: 'f1',
        seatId: 's1',
      });
      const insertOrder = reservations.insert.mock.invocationCallOrder[0];
      const eventOrder = events.seatReserved.mock.invocationCallOrder[0];
      expect(eventOrder).toBeGreaterThan(insertOrder);
    });

    it('never leaks card data into the published event', async () => {
      await useCase.execute(command);
      const payload = JSON.stringify(events.seatReserved.mock.calls[0][0]);
      expect(payload).not.toContain('4242');
      expect(payload).not.toContain('u1');
    });
  });

  describe('flight validation', () => {
    it('fails when the flight does not exist', async () => {
      flights.findBookingInfo.mockResolvedValue(null);
      await expect(useCase.execute(command)).rejects.toThrow(
        FlightNotFoundError,
      );
      expect(uow.run).not.toHaveBeenCalled();
    });

    it.each(['CANCELLED', 'SOLD_OUT'] as const)(
      'fails when the flight is %s',
      async (status) => {
        flights.findBookingInfo.mockResolvedValue(flightInfo({ status }));
        await expect(useCase.execute(command)).rejects.toThrow(
          FlightNotBookableError,
        );
        expect(uow.run).not.toHaveBeenCalled();
      },
    );
  });

  describe('rejection (atomic confirm affected 0 rows)', () => {
    beforeEach(() => seats.tryConfirm.mockResolvedValue(null));

    it('SeatNotFoundError when the seat does not exist', async () => {
      seats.findById.mockResolvedValue(null);
      await expect(useCase.execute(command)).rejects.toThrow(SeatNotFoundError);
    });

    it('SeatNotFoundError when the seat belongs to another flight', async () => {
      seats.findById.mockResolvedValue(makeSeat({ flightId: 'other' }));
      await expect(useCase.execute(command)).rejects.toThrow(SeatNotFoundError);
    });

    it('SeatNotHeldByUserError when someone else holds it', async () => {
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

    it('HoldExpiredError when the own hold already expired', async () => {
      seats.findById.mockResolvedValue(heldSeat('u1', plusSeconds(-1)));
      await expect(useCase.execute(command)).rejects.toThrow(HoldExpiredError);
    });

    it('SeatAlreadyReservedError when the seat is RESERVED', async () => {
      seats.findById.mockResolvedValue(
        makeSeat({ status: SeatStatus.RESERVED }),
      );
      await expect(useCase.execute(command)).rejects.toThrow(
        SeatAlreadyReservedError,
      );
    });

    it('falls back to SeatNotHeldByUserError when the state changed meanwhile', async () => {
      seats.findById.mockResolvedValue(heldSeat('u1', plusSeconds(100)));
      await expect(useCase.execute(command)).rejects.toThrow(
        SeatNotHeldByUserError,
      );
    });

    it('does not charge, persist or publish anything', async () => {
      seats.findById.mockResolvedValue(makeSeat());
      await expect(useCase.execute(command)).rejects.toThrow();
      expect(payments.charge).not.toHaveBeenCalled();
      expect(reservations.insert).not.toHaveBeenCalled();
      expect(events.seatReserved).not.toHaveBeenCalled();
    });
  });

  describe('payment declined', () => {
    beforeEach(() =>
      payments.charge.mockResolvedValue({
        approved: false,
        reason: 'card declined',
      }),
    );

    it('throws PaymentDeclinedError with the reason', async () => {
      await expect(useCase.execute(command)).rejects.toThrow(
        PaymentDeclinedError,
      );
      await expect(useCase.execute(command)).rejects.toThrow('card declined');
    });

    it('does not persist nor publish (the UoW rolls the seat back to HELD)', async () => {
      await expect(useCase.execute(command)).rejects.toThrow();
      expect(reservations.insert).not.toHaveBeenCalled();
      expect(events.seatReserved).not.toHaveBeenCalled();
    });
  });

  describe('infrastructure failures', () => {
    it('propagates an insert failure and publishes nothing', async () => {
      reservations.insert.mockRejectedValue(new Error('db down'));
      await expect(useCase.execute(command)).rejects.toThrow('db down');
      expect(events.seatReserved).not.toHaveBeenCalled();
    });

    it('propagates a payment gateway failure and publishes nothing', async () => {
      payments.charge.mockRejectedValue(new Error('gateway timeout'));
      await expect(useCase.execute(command)).rejects.toThrow('gateway timeout');
      expect(events.seatReserved).not.toHaveBeenCalled();
    });
  });
});
