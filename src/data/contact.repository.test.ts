import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createDbClient, migrate } from "./db";
import { createLibsqlContactRepository, type Contact } from "./contact.repository";

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

function contact(overrides: Partial<Contact> & Pick<Contact, "id" | "name">): Contact {
  return {
    company: null,
    email: null,
    phone: null,
    note: null,
    stage: "nouveau",
    ...overrides,
  };
}

const marie = contact({ id: "1", name: "Marie Dupont" });
const marieComplete = contact({
  id: "1",
  name: "Marie Dupont",
  company: "Acme",
  email: "marie@acme.fr",
  phone: "06 12 34 56 78",
  note: "Rencontrée au salon",
});

describe("ContactRepository (libsql)", () => {
  it("renvoie une liste vide sur une base neuve", async () => {
    const { client, repository } = await openRepository(":memory:");
    expect(await repository.list()).toEqual([]);
    client.close();
  });

  it("renvoie les contacts créés, dans l'ordre d'ajout", async () => {
    const { client, repository } = await openRepository(":memory:");
    const alain = contact({ id: "2", name: "Alain Martin" });
    await repository.create(marie);
    await repository.create(alain);
    expect(await repository.list()).toEqual([marie, alain]);
    client.close();
  });

  it("conserve les contacts après un redémarrage (nouveau client sur le même fichier)", async () => {
    const url = tempDbUrl();
    const first = await openRepository(url);
    await first.repository.create(marie);
    first.client.close();

    const second = await openRepository(url);
    expect(await second.repository.list()).toEqual([marie]);
    second.client.close();
  });

  describe("findById", () => {
    it("renvoie le contact correspondant", async () => {
      const { client, repository } = await openRepository(":memory:");
      await repository.create(marieComplete);
      expect(await repository.findById("1")).toEqual(marieComplete);
      client.close();
    });

    it("renvoie null pour un id inconnu", async () => {
      const { client, repository } = await openRepository(":memory:");
      expect(await repository.findById("inconnu")).toBeNull();
      client.close();
    });
  });

  describe("update", () => {
    it("enregistre l'entreprise, l'email, le téléphone et la note", async () => {
      const { client, repository } = await openRepository(":memory:");
      await repository.create(marie);
      await repository.update(marieComplete);
      expect(await repository.findById("1")).toEqual(marieComplete);
      expect(await repository.list()).toEqual([marieComplete]);
      client.close();
    });

    it("efface un champ remis à null", async () => {
      const { client, repository } = await openRepository(":memory:");
      await repository.create(marieComplete);
      await repository.update({ ...marieComplete, company: null });
      expect((await repository.findById("1"))?.company).toBeNull();
      client.close();
    });

    it("conserve les modifications après un redémarrage", async () => {
      const url = tempDbUrl();
      const first = await openRepository(url);
      await first.repository.create(marie);
      await first.repository.update(marieComplete);
      first.client.close();

      const second = await openRepository(url);
      expect(await second.repository.findById("1")).toEqual(marieComplete);
      second.client.close();
    });
  });

  describe("étape", () => {
    it("enregistre l'étape à la création", async () => {
      const { client, repository } = await openRepository(":memory:");
      await repository.create({ ...marie, stage: "contacte" });
      expect((await repository.findById("1"))?.stage).toBe("contacte");
      client.close();
    });

    it("enregistre un changement d'étape, visible dans la liste", async () => {
      const { client, repository } = await openRepository(":memory:");
      await repository.create({ ...marie, stage: "contacte" });
      await repository.update({ ...marie, stage: "rendez-vous" });
      expect((await repository.findById("1"))?.stage).toBe("rendez-vous");
      expect((await repository.list())[0].stage).toBe("rendez-vous");
      client.close();
    });

    it("conserve la nouvelle étape après un redémarrage", async () => {
      const url = tempDbUrl();
      const first = await openRepository(url);
      await first.repository.create(marie);
      await first.repository.update({ ...marie, stage: "gagne" });
      first.client.close();

      const second = await openRepository(url);
      expect((await second.repository.findById("1"))?.stage).toBe("gagne");
      second.client.close();
    });
  });

  describe("migrate", () => {
    it("met à niveau une base créée au lot 1 sans perdre ses contacts", async () => {
      const url = tempDbUrl();
      const legacy = createDbClient({ url });
      await legacy.execute(
        "CREATE TABLE contacts (id TEXT PRIMARY KEY, name TEXT NOT NULL)",
      );
      await legacy.execute("INSERT INTO contacts (id, name) VALUES ('1', 'Marie Dupont')");
      legacy.close();

      const { client, repository } = await openRepository(url);
      expect(await repository.list()).toEqual([marie]);
      client.close();
    });

    it("peut être relancée sans erreur ni perte", async () => {
      const url = tempDbUrl();
      const first = await openRepository(url);
      await first.repository.create(marieComplete);
      await migrate(first.client);
      expect(await first.repository.list()).toEqual([marieComplete]);
      first.client.close();
    });
  });
});
