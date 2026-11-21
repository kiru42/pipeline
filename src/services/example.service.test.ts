import { describe, expect, it } from "vitest";
import type { ExampleRepository } from "@/data/example.repository";
import { createExampleService } from "./example.service";

describe("ExampleService", () => {
  it("renvoie les éléments fournis par le repository", async () => {
    const fakeRepository: ExampleRepository = {
      list: async () => [{ id: "1" }],
    };
    const service = createExampleService(fakeRepository);
    expect(await service.list()).toEqual([{ id: "1" }]);
  });
});
