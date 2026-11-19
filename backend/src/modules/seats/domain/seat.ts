import {
  HoldExpiredError,
  SeatAlreadyReservedError,
  SeatNotAvailableError,
  SeatNotHeldByUserError,
} from './errors/seat.errors';
import { SeatStatus } from './seat-status';
import { HoldDuration } from './value-objects/hold-duration';

export interface SeatProps {
  id: string;
  flightId: string;
  row: number;
  column: string;
  seatClass: string;
  status: SeatStatus;
  heldBy: string | null;
  holdExpiresAt: Date | null;
}

/**
 * Entidad inmutable: cada transición devuelve una nueva instancia.
 *
 * Nota de diseño: en el camino caliente (hold) la garantía anti
 * double-booking la da el UPDATE condicional atómico de la DB; esta
 * entidad expresa la MISMA regla en el dominio (se usa en confirmación,
 * liberación y expiración, y documenta la regla). La equivalencia
 * SQL <-> dominio se verifica en la prueba de integración.
 */
export class Seat {
  private constructor(private readonly props: SeatProps) {}

  static restore(props: SeatProps): Seat {
    return new Seat({ ...props });
  }

  get id(): string {
    return this.props.id;
  }
  get flightId(): string {
    return this.props.flightId;
  }
  get row(): number {
    return this.props.row;
  }
  get column(): string {
    return this.props.column;
  }
  get seatClass(): string {
    return this.props.seatClass;
  }
  get status(): SeatStatus {
    return this.props.status;
  }
  get heldBy(): string | null {
    return this.props.heldBy;
  }
  get holdExpiresAt(): Date | null {
    return this.props.holdExpiresAt;
  }

  toProps(): SeatProps {
    return { ...this.props };
  }

  isHoldActive(now: Date): boolean {
    return (
      this.props.status === SeatStatus.HELD &&
      this.props.holdExpiresAt !== null &&
      this.props.holdExpiresAt.getTime() > now.getTime()
    );
  }

  /** AVAILABLE, o HELD con el bloqueo ya vencido. */
  isAvailableAt(now: Date): boolean {
    if (this.props.status === SeatStatus.AVAILABLE) return true;
    return this.props.status === SeatStatus.HELD && !this.isHoldActive(now);
  }

  hold(userId: string, now: Date, duration: HoldDuration): Seat {
    if (this.props.status === SeatStatus.RESERVED) {
      throw new SeatAlreadyReservedError(this.props.id);
    }
    if (!this.isAvailableAt(now)) {
      throw new SeatNotAvailableError(this.props.id);
    }
    return new Seat({
      ...this.props,
      status: SeatStatus.HELD,
      heldBy: userId,
      holdExpiresAt: duration.expiresFrom(now),
    });
  }

  confirm(userId: string, now: Date): Seat {
    if (this.props.status === SeatStatus.RESERVED) {
      throw new SeatAlreadyReservedError(this.props.id);
    }
    if (this.props.status !== SeatStatus.HELD || this.props.heldBy !== userId) {
      throw new SeatNotHeldByUserError(this.props.id, userId);
    }
    if (!this.isHoldActive(now)) {
      throw new HoldExpiredError(this.props.id);
    }
    return new Seat({
      ...this.props,
      status: SeatStatus.RESERVED,
      heldBy: null,
      holdExpiresAt: null,
    });
  }

  release(userId: string): Seat {
    if (this.props.status === SeatStatus.RESERVED) {
      throw new SeatAlreadyReservedError(this.props.id);
    }
    if (this.props.status !== SeatStatus.HELD || this.props.heldBy !== userId) {
      throw new SeatNotHeldByUserError(this.props.id, userId);
    }
    return this.toAvailable();
  }

  /** Usado por el sweeper. Si el bloqueo no está vencido, devuelve la misma instancia. */
  releaseIfExpired(now: Date): Seat {
    if (this.props.status === SeatStatus.HELD && !this.isHoldActive(now)) {
      return this.toAvailable();
    }
    return this;
  }

  private toAvailable(): Seat {
    return new Seat({
      ...this.props,
      status: SeatStatus.AVAILABLE,
      heldBy: null,
      holdExpiresAt: null,
    });
  }
}
