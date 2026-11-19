import { DomainError } from './domain.error';
import { domainErrorFrom } from './domain-error-from';

class SampleError extends DomainError {
  readonly code = 'SAMPLE';
  constructor(message = 'sample') {
    super(message);
  }
}

describe('domainErrorFrom', () => {
  it('returns the domain error thrown by the attempt', () => {
    const thrown = new SampleError('thrown');
    const result = domainErrorFrom(() => {
      throw thrown;
    }, new SampleError('fallback'));
    expect(result).toBe(thrown);
  });

  it('returns the fallback when the attempt does not throw', () => {
    const fallback = new SampleError('fallback');
    expect(domainErrorFrom(() => 'ok', fallback)).toBe(fallback);
  });

  it('rethrows errors that are not domain errors', () => {
    expect(() =>
      domainErrorFrom(() => {
        throw new TypeError('boom');
      }, new SampleError()),
    ).toThrow(TypeError);
  });
});
