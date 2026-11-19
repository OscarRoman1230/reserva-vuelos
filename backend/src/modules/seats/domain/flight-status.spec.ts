import { FlightStatus, isFlightBookable } from './flight-status';

describe('isFlightBookable', () => {
  it.each([FlightStatus.SCHEDULED, FlightStatus.DELAYED])(
    '%s is bookable',
    (s) => {
      expect(isFlightBookable(s)).toBe(true);
    },
  );

  it.each([FlightStatus.CANCELLED, FlightStatus.SOLD_OUT])(
    '%s is not bookable',
    (s) => {
      expect(isFlightBookable(s)).toBe(false);
    },
  );
});
