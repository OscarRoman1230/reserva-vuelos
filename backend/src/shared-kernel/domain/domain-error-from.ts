import { DomainError } from './domain.error';

/**
 * Ejecuta un intento sobre la entidad solo para averiguar POR QUÉ falló
 * la operación atómica de la DB. Devuelve el error de dominio lanzado, o
 * `fallback` si el intento no lanza (el estado cambió entre la consulta
 * atómica y esta lectura). Errores que no son de dominio se propagan.
 */
export function domainErrorFrom(
  attempt: () => unknown,
  fallback: DomainError,
): DomainError {
  try {
    attempt();
  } catch (error) {
    if (error instanceof DomainError) return error;
    throw error;
  }
  return fallback;
}
