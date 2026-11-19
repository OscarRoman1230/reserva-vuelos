import { HoldDuration } from '../../domain/value-objects/hold-duration';

/** Duración vigente del bloqueo (app_settings en DB, con caché de 30 s en el adaptador). */
export interface HoldPolicyPort {
  getHoldDuration(): Promise<HoldDuration>;
}
