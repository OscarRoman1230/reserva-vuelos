export const SeatStatus = {
  AVAILABLE: 'AVAILABLE',
  HELD: 'HELD',
  RESERVED: 'RESERVED',
} as const;
export type SeatStatus = (typeof SeatStatus)[keyof typeof SeatStatus];
