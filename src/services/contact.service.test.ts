import { describe, expect, it } from "vitest";
import type { Contact, ContactRepository } from "@/data/contact.repository";
import { createContactService, type ContactDetailsInput } from "./contact.service";

function contact(overrides: Partial<Contact> & Pick<Contact, "id" | "name">): Contact {
  return { company: null, email: null, phone: null, note: null, ...overrides };
}

function createFakeRepository(initial: Contact[] = []) {
  const contacts = initial.map((c) => ({ ...c }));
  let writes = 0;
  const repository: ContactRepository = {
    async list() {
      return contacts.map((c) => ({ ...c }));
    },
    async create(c) {
      writes += 1;
      contacts.push({ ...c });
    },
    async findById(id) {
      const found = contacts.find((c) => c.id === id);
      return found ? { ...found } : null;
    },
    async update(c) {
      writes += 1;
      const index = contacts.findIndex((existing) => existing.id === c.id);
      if (index >= 0) contacts[index] = { ...c };
    },
  };
  return { repository, writes: () => writes };
}

function setup(initial: Contact[] = []) {
  const fake = createFakeRepository(initial);
  let next = 0;
  const service = createContactService(fake.repository, {
    generateId: () => `id-${++next}`,
  });
  return { service, ...fake };
}

const marie = contact({ id: "1", name: "Marie Dupont" });

const details = (overrides: Partial<ContactDetailsInput> = {}): ContactDetailsInput => ({
  company: "",
  email: "",
  phone: "",
  note: "",
  ...overrides,
});

describe("ContactService", () => {
  describe("listContacts", () => {
    it("renvoie une liste vide quand aucun contact n'existe", async () => {
      const { service } = setup();
      expect(await service.listContacts()).toEqual([]);
    });

    it("renvoie les contacts du repository", async () => {
      const { service } = setup([marie]);
      expect(await service.listContacts()).toEqual([marie]);
    });
  });

  describe("addContact", () => {
    it("crée le contact avec l'id généré et le rend visible dans la liste", async () => {
      const { service } = setup();
      const result = await service.addContact("Marie Dupont");
      const expected = contact({ id: "id-1", name: "Marie Dupont" });
      expect(result).toEqual({ ok: true, contact: expected });
      expect(await service.listContacts()).toEqual([expected]);
    });

    it("supprime les espaces autour du nom", async () => {
      const { service } = setup();
      await service.addContact("  Marie Dupont  ");
      expect((await service.listContacts())[0].name).toBe("Marie Dupont");
    });

    it.each([
      ["vide", ""],
      ["composé uniquement d'espaces", "   \t "],
    ])("refuse un nom %s sans rien créer", async (_label, name) => {
      const { service, writes } = setup();
      const result = await service.addContact(name);
      expect(result).toEqual({ ok: false, error: "Le nom est obligatoire." });
      expect(writes()).toBe(0);
      expect(await service.listContacts()).toEqual([]);
    });
  });

  describe("getContact", () => {
    it("renvoie le contact avec ses informations actuelles", async () => {
      const complete = contact({ ...marie, company: "Acme", email: "marie@acme.fr" });
      const { service } = setup([complete]);
      expect(await service.getContact("1")).toEqual(complete);
    });

    it("renvoie null pour un contact inconnu", async () => {
      const { service } = setup([marie]);
      expect(await service.getContact("inconnu")).toBeNull();
    });
  });

  describe("updateContact", () => {
    it("enregistre la nouvelle entreprise, visible dans la fiche et dans la liste", async () => {
      const { service } = setup([marie]);
      const result = await service.updateContact("1", details({ company: "Acme" }));
      const expected = contact({ ...marie, company: "Acme" });
      expect(result).toEqual({ ok: true, contact: expected });
      expect(await service.getContact("1")).toEqual(expected);
      expect(await service.listContacts()).toEqual([expected]);
    });

    it("enregistre l'email, le téléphone et la note, sans espaces autour", async () => {
      const { service } = setup([marie]);
      await service.updateContact(
        "1",
        details({
          company: " Acme ",
          email: " marie@acme.fr ",
          phone: " 06 12 34 56 78 ",
          note: "  Rencontrée au salon  ",
        }),
      );
      expect(await service.getContact("1")).toEqual(
        contact({
          ...marie,
          company: "Acme",
          email: "marie@acme.fr",
          phone: "06 12 34 56 78",
          note: "Rencontrée au salon",
        }),
      );
    });

    it("efface un champ laissé vide ou composé d'espaces", async () => {
      const { service } = setup([contact({ ...marie, company: "Acme", note: "x" })]);
      await service.updateContact("1", details({ company: "", note: "   " }));
      const updated = await service.getContact("1");
      expect(updated?.company).toBeNull();
      expect(updated?.note).toBeNull();
    });

    it("ne modifie pas le nom", async () => {
      const { service } = setup([marie]);
      await service.updateContact("1", details({ company: "Acme" }));
      expect((await service.getContact("1"))?.name).toBe("Marie Dupont");
    });

    it("accepte un email vide", async () => {
      const { service } = setup([marie]);
      const result = await service.updateContact("1", details({ email: "  " }));
      expect(result.ok).toBe(true);
    });

    it.each(["marie@", "marie.dupont.fr", "marie @dupont.fr", "@dupont.fr", "marie@dupont"])(
      "refuse l'email mal formé « %s » sans rien enregistrer",
      async (email) => {
        const { service, writes } = setup([marie]);
        const result = await service.updateContact(
          "1",
          details({ company: "Acme", email }),
        );
        expect(result).toEqual({
          ok: false,
          errors: { email: "L'email n'est pas valide." },
        });
        expect(writes()).toBe(0);
        expect(await service.getContact("1")).toEqual(marie);
      },
    );

    it("refuse la mise à jour d'un contact inconnu", async () => {
      const { service, writes } = setup([marie]);
      const result = await service.updateContact("inconnu", details({ company: "Acme" }));
      expect(result).toEqual({ ok: false, error: "Contact introuvable." });
      expect(writes()).toBe(0);
    });
  });
});
