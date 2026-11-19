export type Example = { id: string };

export interface ExampleRepository {
  list(): Promise<Example[]>;
}

export function createExampleRepository(): ExampleRepository {
  return {
    async list() {
      return [];
    },
  };
}
