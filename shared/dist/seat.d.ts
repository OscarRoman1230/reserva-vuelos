export declare const SEAT_STATUS: {
    readonly AVAILABLE: "AVAILABLE";
    readonly HELD: "HELD";
    readonly RESERVED: "RESERVED";
};
export type SeatStatus = (typeof SEAT_STATUS)[keyof typeof SEAT_STATUS];
export declare const SEAT_CLASS: {
    readonly ECONOMY: "ECONOMY";
    readonly BUSINESS: "BUSINESS";
};
export type SeatClass = (typeof SEAT_CLASS)[keyof typeof SEAT_CLASS];
export interface SeatView {
    id: string;
    flightId: string;
    row: number;
    column: string;
    seatClass: SeatClass;
    status: SeatStatus;
    /** ISO-8601. Solo presente si status === 'HELD'. */
    holdExpiresAt: string | null;
}
//# sourceMappingURL=seat.d.ts.map