import { InvalidReservationError } from './errors/reservation.errors';
import { ReservationCode } from './reservation-code';

export interface ReservationProps {
  id: string;
  code: ReservationCode;
  userId: string;
  flightId: string;
  seatId: string;
  /** Etiqueta legible, p. ej. "12A". */
  seatLabel: string;
  /** Unidades menores de la moneda (centavos). */
  amountMinor: number;
  currency: string;
  paymentRef: string;
  cardLast4: string;
  createdAt: Date;
}

export class Reservation {
  private constructor(private readonly props: ReservationProps) {}

  /** Valida invariantes. También se usa para rehidratar desde la DB. */
  static create(props: ReservationProps): Reservation {
    if (!Number.isInteger(props.amountMinor) || props.amountMinor < 0) {
      throw new InvalidReservationError(
        'amount must be a non-negative integer',
      );
    }
    if (!/^\d{4}$/.test(props.cardLast4)) {
      throw new InvalidReservationError('cardLast4 must be exactly 4 digits');
    }
    return new Reservation({ ...props });
  }

  get id(): string {
    return this.props.id;
  }
  get code(): ReservationCode {
    return this.props.code;
  }
  get userId(): string {
    return this.props.userId;
  }
  get flightId(): string {
    return this.props.flightId;
  }
  get seatId(): string {
    return this.props.seatId;
  }

  toProps(): ReservationProps {
    return { ...this.props };
  }
}
