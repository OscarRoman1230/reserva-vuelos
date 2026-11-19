import { ClockPort } from '@kernel/ports/clock.port';
import { EventPublisherPort } from '@kernel/ports/event-publisher.port';
import { Seat, SeatProps } from '../../domain/seat';
import { SeatStatus } from '../../domain/seat-status';
import {
  FlightBookingInfo,
  FlightReaderPort,
} from '../ports/flight-reader.port';
import { HoldPolicyPort } from '../ports/hold-policy.port';
import { SeatRepositoryPort } from '../ports/seat.repository.port';
import { HoldDuration } from '../../domain/value-objects/hold-duration';

export const NOW = new Date('2026-11-18T10:00:00.000Z');
export const plusSeconds = (s: number): Date =>
  new Date(NOW.getTime() + s * 1000);

export const fixedClock = (now: Date = NOW): ClockPort => ({ now: () => now });

export const mockSeatRepo = (): jest.Mocked<SeatRepositoryPort> => ({
  findById: jest.fn(),
  tryHold: jest.fn(),
  tryRelease: jest.fn(),
  tryConfirm: jest.fn(),
  releaseOtherHolds: jest.fn().mockResolvedValue([]),
  releaseExpired: jest.fn(),
  countByStatus: jest.fn(),
});

export const mockFlights = (): jest.Mocked<FlightReaderPort> => ({
  findBookingInfo: jest.fn(),
});

export const mockEvents = (): jest.Mocked<EventPublisherPort> => ({
  seatHeld: jest.fn(),
  seatReleased: jest.fn(),
  seatReserved: jest.fn(),
  flightStatusChanged: jest.fn(),
  flightOccupancy: jest.fn(),
});

export const mockHoldPolicy = (seconds = 300): jest.Mocked<HoldPolicyPort> => ({
  getHoldDuration: jest
    .fn()
    .mockResolvedValue(HoldDuration.fromSeconds(seconds)),
});

export const flightInfo = (
  overrides: Partial<FlightBookingInfo> = {},
): FlightBookingInfo => ({
  flightId: 'f1',
  status: 'SCHEDULED',
  fareMinor: 45_000_000,
  currency: 'COP',
  ...overrides,
});

export const makeSeat = (overrides: Partial<SeatProps> = {}): Seat =>
  Seat.restore({
    id: 's1',
    flightId: 'f1',
    row: 12,
    column: 'A',
    seatClass: 'ECONOMY',
    status: SeatStatus.AVAILABLE,
    heldBy: null,
    holdExpiresAt: null,
    ...overrides,
  });

export const heldSeat = (
  userId: string,
  expiresAt: Date,
  overrides: Partial<SeatProps> = {},
): Seat =>
  makeSeat({
    status: SeatStatus.HELD,
    heldBy: userId,
    holdExpiresAt: expiresAt,
    ...overrides,
  });
