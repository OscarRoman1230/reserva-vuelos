import { Seat } from '../../domain/seat';

export interface HoldAttempt {
  seatId: string;
  flightId: string;
  userId: string;
  now: Date;
  expiresAt: Date;
}

export interface ReleaseAttempt {
  seatId: string;
  flightId: string;
  userId: string;
}

export interface ConfirmAttempt {
  seatId: string;
  flightId: string;
  userId: string;
  now: Date;
}

export interface ExpiredHold {
  seatId: string;
  flightId: string;
}

export interface SeatCounts {
  total: number;
  available: number;
  held: number;
  reserved: number;
}

export interface ConfirmedSeat {
  row: number;
  column: string;
}

/**
 * Los métodos `try*` son UN solo UPDATE condicional atómico y devuelven
 * `true` si la fila cambió. No lanzan por conflicto: el caso de uso
 * decide el error. La condición de `tryHold` es:
 *   status = 'AVAILABLE' OR (status = 'HELD' AND hold_expires_at <= :now)
 * (misma frontera estricta que Seat.isHoldActive).
 */
export interface SeatRepositoryPort {
  findById(seatId: string): Promise<Seat | null>;
  tryHold(attempt: HoldAttempt): Promise<boolean>;
  /** Libera el bloqueo propio (vigente o no). */
  tryRelease(attempt: ReleaseAttempt): Promise<boolean>;
  /** HELD por el usuario Y con bloqueo vigente (hold_expires_at > :now) → RESERVED. */
  tryConfirm(attempt: ConfirmAttempt): Promise<ConfirmedSeat | null>;
  /** Libera los demás bloqueos del usuario en el vuelo. Devuelve los ids liberados. */
  releaseOtherHolds(
    userId: string,
    flightId: string,
    keepSeatId: string,
  ): Promise<string[]>;
  /** UPDATE ... RETURNING de todos los HELD vencidos. Idempotente entre instancias. */
  releaseExpired(now: Date): Promise<ExpiredHold[]>;
  /** `held` cuenta solo bloqueos vigentes; los vencidos aún sin barrer cuentan como `available`. */
  countByStatus(flightId: string, now: Date): Promise<SeatCounts>;
}
