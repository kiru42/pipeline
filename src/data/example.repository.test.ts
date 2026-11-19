import { describe, expect, it } from "vitest";
import { createExampleRepository } from "./example.repository";

describe("ExampleRepository", () => {
  it("renvoie une liste vide", async () => {
    const repository = createExampleRepository();
    expect(await repository.list()).toEqual([]);
  });
});
