import { ReservationCode } from '../../domain/reservation-code';

export interface ReservationCodeGeneratorPort {
  next(): ReservationCode;
}
