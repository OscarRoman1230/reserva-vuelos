import {
  InvalidReservationCodeError,
  ReservationNotFoundError,
} from '../../domain/errors/reservation.errors';
import { ReservationRepositoryPort } from '../ports/reservation.repository.port';
import { makeReservation, mockReservationRepo } from '../testing/mocks';
import { GetReservationUseCase } from './get-reservation.use-case';

describe('GetReservationUseCase', () => {
  let repo: jest.Mocked<ReservationRepositoryPort>;
  let useCase: GetReservationUseCase;

  beforeEach(() => {
    repo = mockReservationRepo();
    useCase = new GetReservationUseCase(repo);
  });

  it('returns the reservation to its owner', async () => {
    repo.findByCode.mockResolvedValue(makeReservation());
    const result = await useCase.execute({
      code: 'abcd2345',
      requesterId: 'u1',
      isAdmin: false,
    });

    expect(repo.findByCode).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'ABCD2345' }),
    );
    expect(result.code.value).toBe('ABCD2345');
  });

  it('returns it to an admin even if not the owner', async () => {
    repo.findByCode.mockResolvedValue(
      makeReservation({ userId: 'someone-else' }),
    );
    await expect(
      useCase.execute({
        code: 'ABCD2345',
        requesterId: 'admin-1',
        isAdmin: true,
      }),
    ).resolves.toBeDefined();
  });

  it('hides reservations of other users behind "not found"', async () => {
    repo.findByCode.mockResolvedValue(
      makeReservation({ userId: 'someone-else' }),
    );
    await expect(
      useCase.execute({ code: 'ABCD2345', requesterId: 'u1', isAdmin: false }),
    ).rejects.toThrow(ReservationNotFoundError);
  });

  it('fails when the code does not exist', async () => {
    repo.findByCode.mockResolvedValue(null);
    await expect(
      useCase.execute({ code: 'ABCD2345', requesterId: 'u1', isAdmin: false }),
    ).rejects.toThrow(ReservationNotFoundError);
  });

  it('rejects a malformed code without hitting the repository', async () => {
    await expect(
      useCase.execute({ code: 'nope', requesterId: 'u1', isAdmin: false }),
    ).rejects.toThrow(InvalidReservationCodeError);
    expect(repo.findByCode).not.toHaveBeenCalled();
  });
});
