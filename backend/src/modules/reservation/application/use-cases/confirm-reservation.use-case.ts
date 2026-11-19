import { domainErrorFrom } from '@kernel/domain/domain-error-from';
import { ClockPort } from '@kernel/ports/clock.port';
import { EventPublisherPort } from '@kernel/ports/event-publisher.port';
import { IdGeneratorPort } from '@kernel/ports/id-generator.port';
import {
  FlightNotBookableError,
  FlightNotFoundError,
  SeatNotFoundError,
} from '@modules/seats/domain/errors/seat-access.errors';
import { SeatNotHeldByUserError } from '@modules/seats/domain/errors/seat.errors';
import { isFlightBookable } from '@modules/seats/domain/flight-status';
import { FlightReaderPort } from '@modules/seats/application/ports/flight-reader.port';
import { PaymentDeclinedError } from '../../domain/errors/reservation.errors';
import { Reservation, ReservationProps } from '../../domain/reservation';
import { PaymentCard, PaymentPort } from '../ports/payment.port';
import { ReservationCodeGeneratorPort } from '../ports/reservation-code-generator.port';
import {
  ConfirmationScope,
  ReservationUnitOfWorkPort,
} from '../ports/reservation-unit-of-work.port';

export interface ConfirmReservationCommand {
  flightId: string;
  seatId: string;
  userId: string;
  payment: PaymentCard;
}

export class ConfirmReservationUseCase {
  constructor(
    private readonly uow: ReservationUnitOfWorkPort,
    private readonly flights: FlightReaderPort,
    private readonly payments: PaymentPort,
    private readonly codes: ReservationCodeGeneratorPort,
    private readonly ids: IdGeneratorPort,
    private readonly events: EventPublisherPort,
    private readonly clock: ClockPort,
  ) {}

  async execute(command: ConfirmReservationCommand): Promise<ReservationProps> {
    const { flightId, seatId } = command;

    const flight = await this.flights.findBookingInfo(flightId);
    if (!flight) throw new FlightNotFoundError(flightId);
    if (!isFlightBookable(flight.status)) {
      throw new FlightNotBookableError(flightId, flight.status);
    }

    const now = this.clock.now();

    // Todo o nada: si algo lanza dentro, el UoW hace rollback y el asiento sigue HELD.
    const reservation = await this.uow.run(async ({ seats, reservations }) => {
      const confirmed = await seats.tryConfirm({
        seatId,
        flightId,
        userId: command.userId,
        now,
      });
      if (!confirmed) throw await this.explainRejection(seats, command, now);

      const id = this.ids.next();
      const result = await this.payments.charge({
        amountMinor: flight.fareMinor,
        currency: flight.currency,
        card: command.payment,
        reference: id,
      });
      if (!result.approved) throw new PaymentDeclinedError(result.reason);

      const created = Reservation.create({
        id,
        code: this.codes.next(),
        userId: command.userId,
        flightId,
        seatId,
        seatLabel: `${confirmed.row}${confirmed.column}`,
        amountMinor: flight.fareMinor,
        currency: flight.currency,
        paymentRef: result.transactionId,
        cardLast4: command.payment.cardNumber.slice(-4),
        createdAt: now,
      });
      await reservations.insert(created);
      return created;
    });

    // Commit hecho: ahora sí se notifica a todos los clientes.
    this.events.seatReserved({ flightId, seatId });

    return reservation.toProps();
  }

  private async explainRejection(
    seats: ConfirmationScope['seats'],
    { flightId, seatId, userId }: ConfirmReservationCommand,
    now: Date,
  ) {
    const seat = await seats.findById(seatId);
    if (!seat || seat.flightId !== flightId)
      return new SeatNotFoundError(seatId);
    return domainErrorFrom(
      () => seat.confirm(userId, now),
      new SeatNotHeldByUserError(seatId, userId), // el estado cambió entre el UPDATE y esta lectura
    );
  }
}
