import {
  HoldExpiredError,
  SeatAlreadyReservedError,
  SeatNotAvailableError,
  SeatNotHeldByUserError,
} from './errors/seat.errors';
import { Seat, SeatProps } from './seat';
import { SeatStatus } from './seat-status';
import { HoldDuration } from './value-objects/hold-duration';

const NOW = new Date('2026-11-18T10:00:00.000Z');
const PLUS = (s: number) => new Date(NOW.getTime() + s * 1000);
const DURATION = HoldDuration.fromSeconds(300);

const makeSeat = (overrides: Partial<SeatProps> = {}): Seat =>
  Seat.restore({
    id: 'seat-1',
    flightId: 'flight-1',
    row: 12,
    column: 'A',
    seatClass: 'ECONOMY',
    status: SeatStatus.AVAILABLE,
    heldBy: null,
    holdExpiresAt: null,
    ...overrides,
  });

const heldBy = (userId: string, expiresAt: Date) =>
  makeSeat({
    status: SeatStatus.HELD,
    heldBy: userId,
    holdExpiresAt: expiresAt,
  });

describe('Seat', () => {
  describe('restore / getters', () => {
    it('exposes its properties and a defensive copy via toProps', () => {
      const seat = makeSeat();
      expect(seat.id).toBe('seat-1');
      expect(seat.flightId).toBe('flight-1');
      expect(seat.row).toBe(12);
      expect(seat.column).toBe('A');
      expect(seat.seatClass).toBe('ECONOMY');
      expect(seat.status).toBe(SeatStatus.AVAILABLE);
      expect(seat.heldBy).toBeNull();
      expect(seat.holdExpiresAt).toBeNull();

      const props = seat.toProps();
      props.row = 99;
      expect(seat.row).toBe(12);
    });
  });

  describe('isHoldActive / isAvailableAt', () => {
    it('is not active when AVAILABLE', () => {
      expect(makeSeat().isHoldActive(NOW)).toBe(false);
    });

    it('is not active when HELD without expiration (inconsistent data)', () => {
      const seat = makeSeat({
        status: SeatStatus.HELD,
        heldBy: 'u1',
        holdExpiresAt: null,
      });
      expect(seat.isHoldActive(NOW)).toBe(false);
    });

    it('is active when HELD and not expired', () => {
      expect(heldBy('u1', PLUS(10)).isHoldActive(NOW)).toBe(true);
    });

    it('is NOT active exactly at the expiration instant (strict boundary)', () => {
      expect(heldBy('u1', NOW).isHoldActive(NOW)).toBe(false);
    });

    it('is available when AVAILABLE', () => {
      expect(makeSeat().isAvailableAt(NOW)).toBe(true);
    });

    it('is available when HELD with expired hold', () => {
      expect(heldBy('u1', PLUS(-1)).isAvailableAt(NOW)).toBe(true);
    });

    it('is not available when HELD with active hold', () => {
      expect(heldBy('u1', PLUS(10)).isAvailableAt(NOW)).toBe(false);
    });

    it('is not available when RESERVED', () => {
      expect(makeSeat({ status: SeatStatus.RESERVED }).isAvailableAt(NOW)).toBe(
        false,
      );
    });
  });

  describe('hold', () => {
    it('holds an AVAILABLE seat', () => {
      const held = makeSeat().hold('u1', NOW, DURATION);
      expect(held.status).toBe(SeatStatus.HELD);
      expect(held.heldBy).toBe('u1');
      expect(held.holdExpiresAt).toEqual(PLUS(300));
    });

    it('does not mutate the original instance', () => {
      const original = makeSeat();
      original.hold('u1', NOW, DURATION);
      expect(original.status).toBe(SeatStatus.AVAILABLE);
    });

    it('takes over a seat whose previous hold expired', () => {
      const held = heldBy('u1', PLUS(-1)).hold('u2', NOW, DURATION);
      expect(held.heldBy).toBe('u2');
      expect(held.holdExpiresAt).toEqual(PLUS(300));
    });

    it('rejects a seat with an active hold from another user', () => {
      expect(() => heldBy('u1', PLUS(10)).hold('u2', NOW, DURATION)).toThrow(
        SeatNotAvailableError,
      );
    });

    it('rejects a seat with an active hold even from the same user', () => {
      expect(() => heldBy('u1', PLUS(10)).hold('u1', NOW, DURATION)).toThrow(
        SeatNotAvailableError,
      );
    });

    it('rejects a RESERVED seat', () => {
      expect(() =>
        makeSeat({ status: SeatStatus.RESERVED }).hold('u1', NOW, DURATION),
      ).toThrow(SeatAlreadyReservedError);
    });

    it('uses the injected duration (parametrizable from DB)', () => {
      const held = makeSeat().hold('u1', NOW, HoldDuration.fromSeconds(60));
      expect(held.holdExpiresAt).toEqual(PLUS(60));
    });
  });

  describe('confirm', () => {
    it('confirms when the owner has an active hold', () => {
      const reserved = heldBy('u1', PLUS(10)).confirm('u1', NOW);
      expect(reserved.status).toBe(SeatStatus.RESERVED);
      expect(reserved.heldBy).toBeNull();
      expect(reserved.holdExpiresAt).toBeNull();
    });

    it('rejects a different user', () => {
      expect(() => heldBy('u1', PLUS(10)).confirm('u2', NOW)).toThrow(
        SeatNotHeldByUserError,
      );
    });

    it('rejects an AVAILABLE seat', () => {
      expect(() => makeSeat().confirm('u1', NOW)).toThrow(
        SeatNotHeldByUserError,
      );
    });

    it('rejects when the hold expired', () => {
      expect(() => heldBy('u1', PLUS(-1)).confirm('u1', NOW)).toThrow(
        HoldExpiredError,
      );
    });

    it('rejects an already RESERVED seat (terminal state)', () => {
      expect(() =>
        makeSeat({ status: SeatStatus.RESERVED }).confirm('u1', NOW),
      ).toThrow(SeatAlreadyReservedError);
    });
  });

  describe('release', () => {
    it('releases a seat held by the user', () => {
      const released = heldBy('u1', PLUS(10)).release('u1');
      expect(released.status).toBe(SeatStatus.AVAILABLE);
      expect(released.heldBy).toBeNull();
      expect(released.holdExpiresAt).toBeNull();
    });

    it('rejects a different user', () => {
      expect(() => heldBy('u1', PLUS(10)).release('u2')).toThrow(
        SeatNotHeldByUserError,
      );
    });

    it('rejects an AVAILABLE seat', () => {
      expect(() => makeSeat().release('u1')).toThrow(SeatNotHeldByUserError);
    });

    it('rejects a RESERVED seat', () => {
      expect(() =>
        makeSeat({ status: SeatStatus.RESERVED }).release('u1'),
      ).toThrow(SeatAlreadyReservedError);
    });
  });

  describe('releaseIfExpired', () => {
    it('releases an expired hold', () => {
      const released = heldBy('u1', PLUS(-1)).releaseIfExpired(NOW);
      expect(released.status).toBe(SeatStatus.AVAILABLE);
      expect(released.heldBy).toBeNull();
    });

    it('releases exactly at the expiration instant', () => {
      expect(heldBy('u1', NOW).releaseIfExpired(NOW).status).toBe(
        SeatStatus.AVAILABLE,
      );
    });

    it('returns the same instance when the hold is still active', () => {
      const seat = heldBy('u1', PLUS(10));
      expect(seat.releaseIfExpired(NOW)).toBe(seat);
    });

    it('returns the same instance when AVAILABLE', () => {
      const seat = makeSeat();
      expect(seat.releaseIfExpired(NOW)).toBe(seat);
    });

    it('never touches a RESERVED seat', () => {
      const seat = makeSeat({ status: SeatStatus.RESERVED });
      expect(seat.releaseIfExpired(NOW)).toBe(seat);
    });
  });
});
