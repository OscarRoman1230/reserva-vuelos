import { ReservationNotFoundError } from '../../domain/errors/reservation.errors';
import { ReservationProps } from '../../domain/reservation';
import { ReservationCode } from '../../domain/reservation-code';
import { ReservationRepositoryPort } from '../ports/reservation.repository.port';

export interface GetReservationQuery {
  code: string;
  requesterId: string;
  isAdmin: boolean;
}

export class GetReservationUseCase {
  constructor(private readonly reservations: ReservationRepositoryPort) {}

  async execute({
    code,
    requesterId,
    isAdmin,
  }: GetReservationQuery): Promise<ReservationProps> {
    const parsed = ReservationCode.parse(code);
    const reservation = await this.reservations.findByCode(parsed);

    // Si no es suyo, respondemos "no encontrada" para no revelar que el código existe.
    if (!reservation || (!isAdmin && reservation.userId !== requesterId)) {
      throw new ReservationNotFoundError(parsed.value);
    }
    return reservation.toProps();
  }
}
