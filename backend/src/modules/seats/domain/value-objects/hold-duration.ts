import { InvalidHoldDurationError } from '../errors/seat.errors';

/**
 * Duración del bloqueo temporal. El valor real vive en DB (app_settings)
 * y llega aquí a través de HoldPolicyPort.
 */
export class HoldDuration {
  static readonly MIN_SECONDS = 1;
  static readonly MAX_SECONDS = 3600;

  private constructor(readonly seconds: number) {}

  static fromSeconds(seconds: number): HoldDuration {
    if (
      !Number.isInteger(seconds) ||
      seconds < HoldDuration.MIN_SECONDS ||
      seconds > HoldDuration.MAX_SECONDS
    ) {
      throw new InvalidHoldDurationError(seconds);
    }
    return new HoldDuration(seconds);
  }

  expiresFrom(now: Date): Date {
    return new Date(now.getTime() + this.seconds * 1000);
  }
}
