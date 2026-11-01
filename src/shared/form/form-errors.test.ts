import { describe, expect, it, jest } from "@jest/globals";
import { ApiError } from "@/core/api/errors";
import { applyServerErrors, serverFieldErrors } from "./form-errors";

const validation = new ApiError("VALIDATION_ERROR", "Dados inválidos", 400, {
  name: ["Informe seu nome"],
  password: ["A senha precisa de pelo menos 8 caracteres", "A senha precisa ter um número"],
  acceptTerms: ["Aceite os termos para continuar"],
});

describe("serverFieldErrors", () => {
  const fields = ["name", "email", "password"] as const;

  it("mapeia a primeira mensagem dos campos conhecidos", () => {
    expect(serverFieldErrors(validation, fields)).toEqual([
      ["name", "Informe seu nome"],
      ["password", "A senha precisa de pelo menos 8 caracteres"],
    ]);
  });

  it("vazio para erros sem campos ou que não são da API", () => {
    expect(
      serverFieldErrors(new ApiError("CONFLICT", "E-mail já cadastrado", 409), fields),
    ).toEqual([]);
    expect(serverFieldErrors(new Error("x"), fields)).toEqual([]);
  });
});

describe("applyServerErrors", () => {
  type Form = { name: string; email: string; password: string };
  type FormArg = Parameters<typeof applyServerErrors<Form>>[0];
  const makeForm = () => {
    const setError = jest.fn();
    const getValues = jest.fn(() => ({ name: "", email: "", password: "" }));
    return { setError, form: { setError, getValues } as unknown as FormArg };
  };

  it("marca os campos do formulário e foca só o primeiro", () => {
    const { form, setError } = makeForm();
    expect(applyServerErrors(form, validation)).toBe(true);
    expect(setError.mock.calls).toEqual([
      ["name", { message: "Informe seu nome" }, { shouldFocus: true }],
      [
        "password",
        { message: "A senha precisa de pelo menos 8 caracteres" },
        { shouldFocus: false },
      ],
    ]);
  });

  it("respeita a lista de campos e devolve false sem erro de campo", () => {
    const { form, setError } = makeForm();
    expect(applyServerErrors(form, validation, ["password"])).toBe(true);
    expect(setError).toHaveBeenCalledTimes(1);
    expect(applyServerErrors(form, new Error("x"))).toBe(false);
  });
});
