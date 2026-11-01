/** Garante em compilação que um switch cobriu todos os casos de uma união. */
export function assertNever(value: never): never {
  throw new Error(`Caso não tratado: ${String(value)}`);
}
