import { describe, expect, it } from "@jest/globals";
import { cleanResetCode, formatSeconds, secondsLeft } from "./reset-code";

describe("cleanResetCode", () => {
  it("fica só com os 6 primeiros dígitos (colar com espaço ou texto)", () => {
    expect(cleanResetCode("123456")).toBe("123456");
    expect(cleanResetCode("123 456")).toBe("123456");
    expect(cleanResetCode("Seu código é: 123-456.")).toBe("123456");
    expect(cleanResetCode("12345678")).toBe("123456");
    expect(cleanResetCode("12a")).toBe("12");
    expect(cleanResetCode("")).toBe("");
  });
});

describe("secondsLeft / formatSeconds", () => {
  it("arredonda para cima e zera quando passou", () => {
    expect(secondsLeft(10_000, 0)).toBe(10);
    expect(secondsLeft(10_001, 0)).toBe(11);
    expect(secondsLeft(10_000, 10_000)).toBe(0);
    expect(secondsLeft(null, 0)).toBe(0);
  });

  it("formata m:ss", () => {
    expect(formatSeconds(60)).toBe("1:00");
    expect(formatSeconds(45)).toBe("0:45");
    expect(formatSeconds(5)).toBe("0:05");
  });
});
