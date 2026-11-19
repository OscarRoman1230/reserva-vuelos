import { IdGeneratorPort } from '@kernel/ports/id-generator.port';
import { Reservation, ReservationProps } from '../../domain/reservation';
import { ReservationCode } from '../../domain/reservation-code';
import { PaymentCard, PaymentPort } from '../ports/payment.port';
import { ReservationCodeGeneratorPort } from '../ports/reservation-code-generator.port';
import { ReservationRepositoryPort } from '../ports/reservation.repository.port';
import {
  ConfirmationScope,
  ReservationUnitOfWorkPort,
} from '../ports/reservation-unit-of-work.port';

export const CODE = ReservationCode.parse('ABCD2345');

export const validCard = (): PaymentCard => ({
  cardNumber: '4242424242424242',
  cardHolder: 'ANA PEREZ',
  expiry: '12/30',
  cvv: '123',
});

export const mockReservationRepo =
  (): jest.Mocked<ReservationRepositoryPort> => ({
    insert: jest.fn().mockResolvedValue(undefined),
    findByCode: jest.fn(),
  });

export const mockPayments = (): jest.Mocked<PaymentPort> => ({
  charge: jest
    .fn()
    .mockResolvedValue({ approved: true, transactionId: 'tx-1' }),
});

export const mockCodes = (): jest.Mocked<ReservationCodeGeneratorPort> => ({
  next: jest.fn().mockReturnValue(CODE),
});

export const mockIds = (): jest.Mocked<IdGeneratorPort> => ({
  next: jest.fn().mockReturnValue('res-1'),
});

/** UoW falso: ejecuta el trabajo con el scope dado y relanza lo que lance (como un rollback). */
export const mockUow = (
  scope: ConfirmationScope,
): jest.Mocked<ReservationUnitOfWorkPort> => ({
  run: jest.fn((work) =>
    work(scope),
  ) as jest.Mocked<ReservationUnitOfWorkPort>['run'],
});

export const reservationProps = (
  overrides: Partial<ReservationProps> = {},
): ReservationProps => ({
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
  createdAt: new Date('2026-11-18T10:00:00.000Z'),
  ...overrides,
});

export const makeReservation = (
  overrides: Partial<ReservationProps> = {},
): Reservation => Reservation.create(reservationProps(overrides));
