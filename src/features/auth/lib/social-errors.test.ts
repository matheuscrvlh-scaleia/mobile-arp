import { describe, expect, it } from "@jest/globals";
import { ApiError, type AppErrorCode } from "@/core/api/errors";
import { accountMethodOf, idTokenEmail, socialFailure } from "./social-errors";

const apiError = (
  code: AppErrorCode,
  status: number,
  extra: { fieldErrors?: Record<string, string[]>; details?: unknown } = {},
) =>
  new ApiError(
    code,
    "Mensagem da API",
    status,
    extra.fieldErrors ?? null,
    null,
    null,
    extra.details,
  );

/** JWT de mentira (só o payload importa aqui). */
const jwt = (payload: object) => {
  const json = encodeURIComponent(JSON.stringify(payload)).replace(/%([0-9A-F]{2})/g, (_, hex) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
  const b64 = btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `eyJhbGciOiJSUzI1NiJ9.${b64}.assinatura`;
};

describe("socialFailure", () => {
  it("traduz as recusas do /auth/social", () => {
    expect(socialFailure(apiError("TERMS_REQUIRED", 422))).toEqual({ kind: "terms" });
    expect(socialFailure(apiError("INVALID_CREDENTIALS", 401))).toEqual({ kind: "invalid" });
    expect(socialFailure(apiError("FORBIDDEN", 403))).toEqual({
      kind: "blocked",
      message: "Mensagem da API",
    });
    expect(socialFailure(apiError("SERVICE_UNAVAILABLE", 503))).toEqual({ kind: "unavailable" });
    expect(socialFailure(apiError("RATE_LIMITED", 429))).toEqual({ kind: "rate-limited" });
    expect(socialFailure(apiError("NETWORK_ERROR", 0))).toEqual({ kind: "other" });
    expect(socialFailure(new Error("x"))).toEqual({ kind: "other" });
  });

  it("409 diz com que método a conta entra (details.provider)", () => {
    for (const method of ["password", "google", "apple"] as const) {
      expect(
        socialFailure(apiError("EMAIL_USES_OTHER_LOGIN", 409, { details: { provider: method } })),
      ).toEqual({ kind: "other-login", method });
    }
  });

  it("409 sem provedor reconhecível vira erro genérico", () => {
    expect(
      socialFailure(apiError("EMAIL_USES_OTHER_LOGIN", 409, { details: { provider: "x" } })),
    ).toEqual({ kind: "other" });
  });
});

describe("accountMethodOf", () => {
  it("lê de details ou, na falta, de fieldErrors", () => {
    expect(
      accountMethodOf(apiError("EMAIL_USES_OTHER_LOGIN", 409, { details: { provider: "apple" } })),
    ).toBe("apple");
    expect(
      accountMethodOf(
        apiError("EMAIL_USES_OTHER_LOGIN", 409, { fieldErrors: { provider: ["google"] } }),
      ),
    ).toBe("google");
    expect(accountMethodOf(apiError("EMAIL_USES_OTHER_LOGIN", 409))).toBeNull();
    expect(accountMethodOf(new Error("x"))).toBeNull();
  });
});

describe("idTokenEmail", () => {
  it("lê o claim email do id_token", () => {
    expect(idTokenEmail(jwt({ sub: "1", email: "Ana@Email.com" }))).toBe("ana@email.com");
    expect(idTokenEmail(jwt({ sub: "1", name: "João", email: "joão@email.com" }))).toBe(
      "joão@email.com",
    );
  });

  it("null sem e-mail ou com token malformado", () => {
    expect(idTokenEmail(jwt({ sub: "1" }))).toBeNull();
    expect(idTokenEmail("nao-e-jwt")).toBeNull();
    expect(idTokenEmail("a.%%%.c")).toBeNull();
  });
});
