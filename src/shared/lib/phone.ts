/*
 * Celular brasileiro com DDD: "(24) 98888-1234" (celular, 11 dígitos) ou
 * "(24) 3333-1234" (fixo, 10). Máscara aplicada enquanto digita; nunca deixa
 * separador sobrando no fim, então o apagar sempre remove um dígito.
 */

const MAX_DIGITS = 11;

/** Só os dígitos (no máximo 11), sem o +55 de um número colado. */
export function phoneDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  // Só com "+55" explícito: 55 também é DDD (RS).
  const local = value.trim().startsWith("+55") ? digits.slice(2) : digits;
  return local.slice(0, MAX_DIGITS);
}

export function maskPhone(value: string): string {
  const d = phoneDigits(value);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  const split = rest.length <= 8 ? 4 : 5;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

/** Vazio (opcional) ou completo com DDD. */
export function isValidOptionalPhone(value: string): boolean {
  const n = phoneDigits(value).length;
  return n === 0 || n === 10 || n === 11;
}

/** Para a API: máscara completa ou null quando vazio. */
export function phoneForApi(value: string): string | null {
  return phoneDigits(value) ? maskPhone(value) : null;
}
