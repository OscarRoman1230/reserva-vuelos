import { InvalidReservationCodeError } from './errors/reservation.errors';

/** Código legible de 8 caracteres, sin símbolos ambiguos (I, O, 0, 1). */
export class ReservationCode {
  static readonly ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  static readonly LENGTH = 8;
  private static readonly PATTERN = new RegExp(
    `^[${ReservationCode.ALPHABET}]{${ReservationCode.LENGTH}}$`,
  );

  private constructor(readonly value: string) {}

  /** Normaliza (trim + mayúsculas) y valida. */
  static parse(raw: string): ReservationCode {
    const normalized = raw.trim().toUpperCase();
    if (!ReservationCode.PATTERN.test(normalized)) {
      throw new InvalidReservationCodeError(raw);
    }
    return new ReservationCode(normalized);
  }

  toString(): string {
    return this.value;
  }
}
