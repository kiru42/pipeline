import { describe, expect, it } from "vitest";
import { formatDay, formatDueIn } from "./dates";

describe("formatDay", () => {
  it("affiche une date AAAA-MM-JJ au format JJ/MM", () => {
    expect(formatDay("2026-11-25")).toBe("25/11");
    expect(formatDay("2027-01-05")).toBe("05/01");
  });
});

describe("formatDueIn", () => {
  it.each([
    [0, "aujourd'hui"],
    [1, "demain"],
    [2, "dans 2 j"],
    [7, "dans 7 j"],
    [-1, "en retard de 1 j"],
    [-3, "en retard de 3 j"],
  ])("affiche une échéance de %i jour(s) : « %s »", (days, label) => {
    expect(formatDueIn(days)).toBe(label);
  });
});
