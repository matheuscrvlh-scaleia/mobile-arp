import { describe, expect, it } from "@jest/globals";
import { memberSince, splitMoney, visitorLevel } from "./profile";

describe("profile", () => {
  it("memberSince usa o mês por extenso", () => {
    expect(memberSince("2026-10-15T15:00:00.000Z")).toBe("outubro de 2026");
  });

  it("visitorLevel: 3 selos ou mais = Frequentador", () => {
    expect(visitorLevel(0)).toBe("Explorador");
    expect(visitorLevel(2)).toBe("Explorador");
    expect(visitorLevel(3)).toBe("Frequentador");
  });

  it("splitMoney separa os centavos", () => {
    expect(splitMoney(3750)).toEqual(["R$ 37", ",50"]);
    expect(splitMoney(0)).toEqual(["R$ 0", ",00"]);
  });
});
