import { validDaysLabel, validToday } from "./weekdays";

describe("dias do cupom", () => {
  it("diz os dias em que vale", () => {
    expect(validDaysLabel([0, 1, 2, 3, 4, 5, 6])).toBe("Vale todos os dias");
    expect(validDaysLabel([1, 2, 3, 4, 5])).toBe("Vale seg a sex");
    expect(validDaysLabel([0, 1, 3])).toBe("Vale seg, qua e dom");
  });

  it("sabe se hoje pode usar", () => {
    const monday = new Date(2026, 10, 2, 12).getTime();
    expect(validToday([1, 2], monday)).toBe(true);
    expect(validToday([0, 6], monday)).toBe(false);
  });
});
