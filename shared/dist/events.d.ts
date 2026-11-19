import type { FlightStatus } from './flight';
export declare const EVENTS: {
    readonly SEAT_HELD: "seat.held";
    readonly SEAT_RELEASED: "seat.released";
    readonly SEAT_RESERVED: "seat.reserved";
    readonly FLIGHT_STATUS_CHANGED: "flight.status_changed";
    readonly FLIGHT_OCCUPANCY: "flight.occupancy";
};
export declare const CLIENT_COMMANDS: {
    readonly JOIN_FLIGHT: "flight.join";
    readonly LEAVE_FLIGHT: "flight.leave";
    readonly JOIN_FLIGHT_LIST: "flights.join";
};
export type ReleaseReason = 'EXPIRED' | 'RELEASED_BY_USER';
/** Nunca exponemos el userId del titular del bloqueo a otros clientes. */
export interface SeatHeldEvent {
    flightId: string;
    seatId: string;
    expiresAt: string;
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
    [CLIENT_COMMANDS.JOIN_FLIGHT]: (p: {
        flightId: string;
    }) => void;
    [CLIENT_COMMANDS.LEAVE_FLIGHT]: (p: {
        flightId: string;
    }) => void;
    [CLIENT_COMMANDS.JOIN_FLIGHT_LIST]: () => void;
}
//# sourceMappingURL=events.d.ts.map