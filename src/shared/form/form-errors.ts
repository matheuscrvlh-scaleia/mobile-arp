import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { isApiError } from "@/core/api/errors";

/**
 * Erros por campo de um VALIDATION_ERROR da API, só dos campos que o
 * formulário tem (primeira mensagem de cada). Vazio quando não se aplica.
 */
export function serverFieldErrors<F extends string>(
  error: unknown,
  fields: readonly F[],
): Array<[F, string]> {
  if (!isApiError(error) || !error.fieldErrors) return [];
  const out: Array<[F, string]> = [];
  for (const field of fields) {
    const message = error.fieldErrors[field]?.[0];
    if (message) out.push([field, message]);
  }
  return out;
}

type FormLike<T extends FieldValues> = Pick<UseFormReturn<T>, "setError" | "getValues">;

/**
 * Mostra nos campos os erros de validação devolvidos pela API e põe o foco no
 * primeiro. `fields` padrão = os campos do formulário (chaves dos valores).
 * true = havia erro de campo (a tela não precisa de outro aviso).
 */
export function applyServerErrors<T extends FieldValues>(
  form: FormLike<T>,
  error: unknown,
  fields?: readonly Path<T>[],
): boolean {
  const names = fields ?? (Object.keys(form.getValues()) as Path<T>[]);
  const errors = serverFieldErrors(error, names);
  errors.forEach(([field, message], index) => {
    form.setError(field, { message }, { shouldFocus: index === 0 });
  });
  return errors.length > 0;
}
