import { SeatRepositoryPort } from '@modules/seats/application/ports/seat.repository.port';
import { ReservationRepositoryPort } from './reservation.repository.port';

/** Repositorios ligados a UNA misma transacción. */
export interface ConfirmationScope {
  seats: Pick<SeatRepositoryPort, 'tryConfirm' | 'findById'>;
  reservations: Pick<ReservationRepositoryPort, 'insert'>;
}

/**
 * Ejecuta `work` en una transacción: commit si resuelve, rollback si lanza
 * (y relanza el error original).
 */
export interface ReservationUnitOfWorkPort {
  run<T>(work: (scope: ConfirmationScope) => Promise<T>): Promise<T>;
}
