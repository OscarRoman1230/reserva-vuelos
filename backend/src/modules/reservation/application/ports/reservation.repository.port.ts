import { Reservation } from '../../domain/reservation';
import { ReservationCode } from '../../domain/reservation-code';

export interface ReservationRepositoryPort {
  insert(reservation: Reservation): Promise<void>;
  findByCode(code: ReservationCode): Promise<Reservation | null>;
}
