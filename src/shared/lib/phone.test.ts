import { describe, expect, it } from "@jest/globals";
import { isValidOptionalPhone, maskPhone, phoneDigits, phoneForApi } from "./phone";

describe("maskPhone", () => {
  it.each([
    ["", ""],
    ["2", "(2"],
    ["24", "(24"],
    ["249", "(24) 9"],
    ["249888", "(24) 9888"],
    ["2498888", "(24) 9888-8"],
    ["2433331234", "(24) 3333-1234"],
    ["24988881234", "(24) 98888-1234"],
  ])("%j → %j", (input, masked) => {
    expect(maskPhone(input)).toBe(masked);
  });

  it("ignora o que não é dígito e corta no 11º dígito", () => {
    expect(maskPhone("(24) 98888-1234 999")).toBe("(24) 98888-1234");
    expect(maskPhone("abc")).toBe("");
  });

  it("tira o +55 de um número colado", () => {
    expect(maskPhone("+55 24 98888-1234")).toBe("(24) 98888-1234");
    expect(maskPhone("55999991234")).toBe("(55) 99999-1234");
  });

  it("é estável quando reaplicada", () => {
    const once = maskPhone("24988881234");
    expect(maskPhone(once)).toBe(once);
  });

  it("apagar o último caractere remove um dígito (sem separador sobrando)", () => {
    expect(maskPhone("(24) 9")).toBe("(24) 9");
    expect(maskPhone("(24) ".slice(0, -1))).toBe("(24");
    expect(maskPhone("(24) 98888-123")).toBe("(24) 9888-8123");
  });
});

describe("phoneDigits / validação", () => {
  it("extrai os dígitos", () => {
    expect(phoneDigits("(24) 98888-1234")).toBe("24988881234");
  });

  it("aceita vazio, fixo e celular; recusa incompleto", () => {
    expect(isValidOptionalPhone("")).toBe(true);
    expect(isValidOptionalPhone("(24) 3333-1234")).toBe(true);
    expect(isValidOptionalPhone("(24) 98888-1234")).toBe(true);
    expect(isValidOptionalPhone("(24) 9888")).toBe(false);
  });

  it("phoneForApi devolve null quando vazio", () => {
    expect(phoneForApi("")).toBeNull();
    expect(phoneForApi("24988881234")).toBe("(24) 98888-1234");
  });
});
