import { describe, expect, it } from "vitest";
import type { Contact, ContactRepository } from "@/data/contact.repository";
import { createContactService } from "./contact.service";

function createFakeRepository(initial: Contact[] = []) {
  const contacts = [...initial];
  let createCalls = 0;
  const repository: ContactRepository = {
    async list() {
      return [...contacts];
    },
    async create(contact) {
      createCalls += 1;
      contacts.push(contact);
    },
  };
  return { repository, createCalls: () => createCalls };
}

function setup(initial: Contact[] = []) {
  const fake = createFakeRepository(initial);
  let next = 0;
  const service = createContactService(fake.repository, {
    generateId: () => `id-${++next}`,
  });
  return { service, ...fake };
}

describe("ContactService", () => {
  describe("listContacts", () => {
    it("renvoie une liste vide quand aucun contact n'existe", async () => {
      const { service } = setup();
      expect(await service.listContacts()).toEqual([]);
    });

    it("renvoie les contacts du repository", async () => {
      const { service } = setup([{ id: "a", name: "Alain Martin" }]);
      expect(await service.listContacts()).toEqual([
        { id: "a", name: "Alain Martin" },
      ]);
    });
  });

  describe("addContact", () => {
    it("crée le contact avec l'id généré et le rend visible dans la liste", async () => {
      const { service } = setup();
      const result = await service.addContact("Marie Dupont");
      expect(result).toEqual({
        ok: true,
        contact: { id: "id-1", name: "Marie Dupont" },
      });
      expect(await service.listContacts()).toEqual([
        { id: "id-1", name: "Marie Dupont" },
      ]);
    });

    it("supprime les espaces autour du nom", async () => {
      const { service } = setup();
      await service.addContact("  Marie Dupont  ");
      expect(await service.listContacts()).toEqual([
        { id: "id-1", name: "Marie Dupont" },
      ]);
    });

    it.each([
      ["vide", ""],
      ["composé uniquement d'espaces", "   \t "],
    ])("refuse un nom %s sans rien créer", async (_label, name) => {
      const { service, createCalls } = setup();
      const result = await service.addContact(name);
      expect(result).toEqual({ ok: false, error: "Le nom est obligatoire." });
      expect(createCalls()).toBe(0);
      expect(await service.listContacts()).toEqual([]);
    });
  });
});
