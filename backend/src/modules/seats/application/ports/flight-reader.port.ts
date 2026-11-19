import { FlightStatus } from '../../domain/flight-status';

export interface FlightBookingInfo {
  flightId: string;
  status: FlightStatus;
  /** Tarifa en unidades menores de la moneda (centavos). */
  fareMinor: number;
  currency: string;
}

/** Lo implementa el módulo de vuelos; seats solo depende de esta vista mínima. */
export interface FlightReaderPort {
  findBookingInfo(flightId: string): Promise<FlightBookingInfo | null>;
}
