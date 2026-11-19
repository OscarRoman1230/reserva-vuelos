export const FlightStatus = {
  SCHEDULED: 'SCHEDULED',
  DELAYED: 'DELAYED',
  CANCELLED: 'CANCELLED',
  SOLD_OUT: 'SOLD_OUT',
} as const;
export type FlightStatus = (typeof FlightStatus)[keyof typeof FlightStatus];

/** Solo los vuelos programados o retrasados admiten bloqueos. */
export const isFlightBookable = (status: FlightStatus): boolean =>
  status === FlightStatus.SCHEDULED || status === FlightStatus.DELAYED;
