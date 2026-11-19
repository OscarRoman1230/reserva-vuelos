export const FLIGHT_STATUS = {
    SCHEDULED: 'SCHEDULED',
    DELAYED: 'DELAYED',
    CANCELLED: 'CANCELLED',
    SOLD_OUT: 'SOLD_OUT',
} as const;
export type FlightStatus = (typeof FLIGHT_STATUS)[keyof typeof FLIGHT_STATUS];