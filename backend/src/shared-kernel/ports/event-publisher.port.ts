import type {
  FlightOccupancyEvent,
  FlightStatusChangedEvent,
  SeatHeldEvent,
  SeatReleasedEvent,
  SeatReservedEvent,
} from '@flights/shared';

/**
 * Contrato: fire-and-forget. Las implementaciones NO deben lanzar ni
 * bloquear (capturan y registran sus propios errores). Un fallo al
 * notificar nunca debe convertir en error una operación ya confirmada
 * en la base de datos. Los eventos se publican DESPUÉS del commit.
 */
export interface EventPublisherPort {
  seatHeld(event: SeatHeldEvent): void;
  seatReleased(event: SeatReleasedEvent): void;
  seatReserved(event: SeatReservedEvent): void;
  flightStatusChanged(event: FlightStatusChangedEvent): void;
  flightOccupancy(event: FlightOccupancyEvent): void;
}
