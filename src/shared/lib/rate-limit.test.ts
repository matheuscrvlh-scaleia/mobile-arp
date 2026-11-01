import { describe, expect, it } from "@jest/globals";
import { ApiError } from "@/core/api/errors";
import { rateLimitedUntil, rateLimitMessage } from "./rate-limit";

const limited = (retryAfter: number | null) =>
  new ApiError("RATE_LIMITED", "x", 429, null, null, retryAfter);

describe("rateLimitedUntil", () => {
  it("usa o Retry-After da API", () => {
    expect(rateLimitedUntil(limited(45), 1000)).toBe(46_000);
  });
  it("sem Retry-After espera 1 minuto", () => {
    expect(rateLimitedUntil(limited(null), 0)).toBe(60_000);
  });
  it("ignora o que não é 429", () => {
    expect(rateLimitedUntil(new ApiError("INVALID_CREDENTIALS", "x", 401), 0)).toBeNull();
    expect(rateLimitedUntil(new Error("x"), 0)).toBeNull();
  });
});

describe("rateLimitMessage", () => {
  it("segundos no último minuto, minutos antes disso", () => {
    expect(rateLimitMessage(46_000, 1000)).toBe(
      "Muitas tentativas seguidas. Tente de novo em 45 s.",
    );
    expect(rateLimitMessage(150_000, 0)).toBe(
      "Muitas tentativas seguidas. Tente de novo em 3 min.",
    );
  });
  it("null quando a espera acabou", () => {
    expect(rateLimitMessage(1000, 1000)).toBeNull();
    expect(rateLimitMessage(null, 0)).toBeNull();
  });
});
