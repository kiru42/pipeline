import type { Example, ExampleRepository } from "@/data/example.repository";

export type { Example };

export function createExampleService(repository: ExampleRepository) {
  return {
    list(): Promise<Example[]> {
      return repository.list();
    },
  };
}
