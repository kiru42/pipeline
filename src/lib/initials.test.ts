import { describe, expect, it } from "vitest";
import { initials } from "./initials";

describe("initials", () => {
  it.each([
    ["Camille Durand", "CD"],
    ["john", "J"],
    ["  léa   bernard  ", "LB"],
    ["Jean Pierre Martin", "JP"],
    ["", ""],
  ])("donne les initiales de « %s » : « %s »", (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});
