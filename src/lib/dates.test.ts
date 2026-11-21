import { describe, expect, it } from "vitest";
import { formatDay } from "./dates";

describe("formatDay", () => {
  it("affiche une date AAAA-MM-JJ au format JJ/MM", () => {
    expect(formatDay("2026-11-25")).toBe("25/11");
    expect(formatDay("2027-01-05")).toBe("05/01");
  });
});
