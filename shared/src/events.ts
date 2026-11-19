import type { FlightStatus } from './flight';

export const EVENTS = {
    SEAT_HELD: 'seat.held',
    SEAT_RELEASED: 'seat.released',
    SEAT_RESERVED: 'seat.reserved',
    FLIGHT_STATUS_CHANGED: 'flight.status_changed',
    FLIGHT_OCCUPANCY: 'flight.occupancy',
} as const;

export const CLIENT_COMMANDS = {
    JOIN_FLIGHT: 'flight.join',
    LEAVE_FLIGHT: 'flight.leave',
    JOIN_FLIGHT_LIST: 'flights.join',
} as const;

export type ReleaseReason = 'EXPIRED' | 'RELEASED_BY_USER';

/** Nunca exponemos el userId del titular del bloqueo a otros clientes. */
export interface SeatHeldEvent {
    flightId: string;
    seatId: string;
    expiresAt: string; // ISO-8601
}

export interface SeatReleasedEvent {
    flightId: string;
    seatId: string;
    reason: ReleaseReason;
}

export interface SeatReservedEvent {
    flightId: string;
    seatId: string;
}

export interface FlightStatusChangedEvent {
    flightId: string;
    status: FlightStatus;
}

export interface FlightOccupancyEvent {
    flightId: string;
    total: number;
    available: number;
    held: number;
    reserved: number;
}

/** Tipado directo para Socket.io (servidor y cliente). */
export interface ServerToClientEvents {
    [EVENTS.SEAT_HELD]: (e: SeatHeldEvent) => void;
    [EVENTS.SEAT_RELEASED]: (e: SeatReleasedEvent) => void;
    [EVENTS.SEAT_RESERVED]: (e: SeatReservedEvent) => void;
    [EVENTS.FLIGHT_STATUS_CHANGED]: (e: FlightStatusChangedEvent) => void;
    [EVENTS.FLIGHT_OCCUPANCY]: (e: FlightOccupancyEvent) => void;
}

export interface ClientToServerEvents {
    [CLIENT_COMMANDS.JOIN_FLIGHT]: (p: { flightId: string }) => void;
    [CLIENT_COMMANDS.LEAVE_FLIGHT]: (p: { flightId: string }) => void;
    [CLIENT_COMMANDS.JOIN_FLIGHT_LIST]: () => void;
}