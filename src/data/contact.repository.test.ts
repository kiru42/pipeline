import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createDbClient, migrate } from "./db";
import { createLibsqlContactRepository } from "./contact.repository";

const dirs: string[] = [];

function tempDbUrl() {
  const dir = mkdtempSync(join(tmpdir(), "pipeline-"));
  dirs.push(dir);
  return `file:${join(dir, "test.db")}`;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

async function openRepository(url: string) {
  const client = createDbClient({ url });
  await migrate(client);
  return { client, repository: createLibsqlContactRepository(client) };
}

describe("ContactRepository (libsql)", () => {
  it("renvoie une liste vide sur une base neuve", async () => {
    const { client, repository } = await openRepository(":memory:");
    expect(await repository.list()).toEqual([]);
    client.close();
  });

  it("renvoie les contacts créés, dans l'ordre d'ajout", async () => {
    const { client, repository } = await openRepository(":memory:");
    await repository.create({ id: "1", name: "Marie Dupont" });
    await repository.create({ id: "2", name: "Alain Martin" });
    expect(await repository.list()).toEqual([
      { id: "1", name: "Marie Dupont" },
      { id: "2", name: "Alain Martin" },
    ]);
    client.close();
  });

  it("conserve les contacts après un redémarrage (nouveau client sur le même fichier)", async () => {
    const url = tempDbUrl();
    const first = await openRepository(url);
    await first.repository.create({ id: "1", name: "Marie Dupont" });
    first.client.close();

    const second = await openRepository(url);
    expect(await second.repository.list()).toEqual([
      { id: "1", name: "Marie Dupont" },
    ]);
    second.client.close();
  });
});
