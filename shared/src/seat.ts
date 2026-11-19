export const SEAT_STATUS = {
    AVAILABLE: 'AVAILABLE',
    HELD: 'HELD',
    RESERVED: 'RESERVED',
} as const;
export type SeatStatus = (typeof SEAT_STATUS)[keyof typeof SEAT_STATUS];

export const SEAT_CLASS = {
    ECONOMY: 'ECONOMY',
    BUSINESS: 'BUSINESS',
} as const;
export type SeatClass = (typeof SEAT_CLASS)[keyof typeof SEAT_CLASS];

export interface SeatView {
    id: string;
    flightId: string;
    row: number;
    column: string; // 'A'..'F'
    seatClass: SeatClass;
    status: SeatStatus;
    /** ISO-8601. Solo presente si status === 'HELD'. */
    holdExpiresAt: string | null;
}