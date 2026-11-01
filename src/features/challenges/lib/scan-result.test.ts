import { describe, expect, it } from "@jest/globals";
import { ApiError } from "@/core/api/errors";
import { retryInLabel, scanFailure, scanRefusal } from "./scan-result";

const err = (
  code: ConstructorParameters<typeof ApiError>[0],
  status: number,
  retryAfter?: number,
) => new ApiError(code, "x", status, null, null, retryAfter ?? null);

describe("scanFailure", () => {
  it("recusas da API viram painel", () => {
    expect(scanRefusal(err("QR_EXPIRED", 410), undefined)).toBe("expired");
    expect(scanRefusal(err("QR_INVALID", 422), undefined)).toBe("invalid");
    expect(scanFailure(err("SEAL_ALREADY_EARNED", 409), undefined)).toEqual({
      kind: "refusal",
      refusal: "duplicate",
    });
  });

  it("429 trava pelo Retry-After (ou o padrão)", () => {
    expect(scanFailure(err("RATE_LIMITED", 429, 12), undefined)).toEqual({
      kind: "rateLimited",
      retryAfterSec: 12,
    });
    expect(scanFailure(err("RATE_LIMITED", 429), undefined)).toEqual({
      kind: "rateLimited",
      retryAfterSec: 30,
    });
  });

  it("rede/servidor: falha transitória (sem reenvio automático)", () => {
    expect(scanFailure(err("NETWORK_ERROR", 0), undefined)).toEqual({ kind: "transient" });
    expect(scanFailure(new Error("x"), undefined)).toEqual({ kind: "transient" });
  });

  it("contagem", () => {
    expect(retryInLabel(11_200)).toBe("Tente de novo em 12s");
    expect(retryInLabel(0)).toBe("Tente de novo em 1s");
  });
});
