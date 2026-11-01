import { describe, expect, it } from "@jest/globals";
import { firstName, initials } from "./names";

describe("names", () => {
  it("firstName pega o primeiro nome", () => {
    expect(firstName("  Ana Clara Souza ")).toBe("Ana");
    expect(firstName("Ana")).toBe("Ana");
    expect(firstName("")).toBe("");
    expect(firstName(null)).toBe("");
  });

  it("initials: primeira e última iniciais", () => {
    expect(initials("Ana Clara Souza")).toBe("AS");
    expect(initials(" ana ")).toBe("A");
    expect(initials("")).toBe("");
  });
});
