import { describe, expect, it } from "vitest";
import type { Contact, ContactRepository } from "@/data/contact.repository";
import { createContactService, type ContactDetailsInput } from "./contact.service";

function contact(overrides: Partial<Contact> & Pick<Contact, "id" | "name">): Contact {
  return {
    company: null,
    email: null,
    phone: null,
    note: null,
    stage: "nouveau",
    nextFollowUp: null,
    ...overrides,
  };
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
    async listWithFollowUpDueBy(date) {
      return contacts
        .filter((c) => c.nextFollowUp !== null && c.nextFollowUp <= date)
        .sort((a, b) => (a.nextFollowUp! < b.nextFollowUp! ? -1 : 1))
        .map((c) => ({ ...c }));
    },
  };
  return { repository, writes: () => writes };
}

const TODAY = "2026-11-21";

function setup(initial: Contact[] = []) {
  const fake = createFakeRepository(initial);
  let next = 0;
  const service = createContactService(fake.repository, {
    generateId: () => `id-${++next}`,
    today: () => TODAY,
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

    it("place le nouveau contact à l'étape « Nouveau »", async () => {
      const { service } = setup();
      await service.addContact("Marie Dupont");
      expect((await service.listContacts())[0].stage).toBe("nouveau");
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

  describe("changeStage", () => {
    it("fait passer un contact « Contacté » à « Rendez-vous », dans la fiche et la liste", async () => {
      const { service } = setup([contact({ ...marie, stage: "contacte" })]);
      const result = await service.changeStage("1", "rendez-vous");
      const expected = contact({ ...marie, stage: "rendez-vous" });
      expect(result).toEqual({ ok: true, contact: expected });
      expect(await service.getContact("1")).toEqual(expected);
      expect(await service.listContacts()).toEqual([expected]);
    });

    it("permet de clore un contact puis de le rouvrir", async () => {
      const { service } = setup([marie]);
      await service.changeStage("1", "perdu");
      expect((await service.getContact("1"))?.stage).toBe("perdu");
      await service.changeStage("1", "contacte");
      expect((await service.getContact("1"))?.stage).toBe("contacte");
    });

    it("ne modifie pas les autres informations du contact", async () => {
      const complete = contact({ ...marie, company: "Acme", email: "marie@acme.fr" });
      const { service } = setup([complete]);
      await service.changeStage("1", "proposition");
      expect(await service.getContact("1")).toEqual({ ...complete, stage: "proposition" });
    });

    it.each(["gagne", "perdu"])(
      "supprime la relance d'un contact qui passe à l'étape close « %s »",
      async (stage) => {
        const { service } = setup([contact({ ...marie, nextFollowUp: "2026-11-25" })]);
        await service.changeStage("1", stage);
        expect((await service.getContact("1"))?.nextFollowUp).toBeNull();
      },
    );

    it("conserve la relance d'un contact qui reste ouvert", async () => {
      const { service } = setup([contact({ ...marie, nextFollowUp: "2026-11-25" })]);
      await service.changeStage("1", "proposition");
      expect((await service.getContact("1"))?.nextFollowUp).toBe("2026-11-25");
    });

    it("refuse une étape inconnue sans rien enregistrer", async () => {
      const { service, writes } = setup([marie]);
      const result = await service.changeStage("1", "archive");
      expect(result).toEqual({ ok: false, error: "Étape inconnue." });
      expect(writes()).toBe(0);
    });

    it("refuse un contact inconnu", async () => {
      const { service, writes } = setup([marie]);
      const result = await service.changeStage("inconnu", "contacte");
      expect(result).toEqual({ ok: false, error: "Contact introuvable." });
      expect(writes()).toBe(0);
    });
  });

  describe("scheduleFollowUp", () => {
    it("planifie la relance d'un contact sans relance", async () => {
      const { service } = setup([marie]);
      const result = await service.scheduleFollowUp("1", "2026-11-25");
      const expected = contact({ ...marie, nextFollowUp: "2026-11-25" });
      expect(result).toEqual({ ok: true, contact: expected });
      expect(await service.getContact("1")).toEqual(expected);
      expect(await service.listContacts()).toEqual([expected]);
    });

    it("remplace une relance existante", async () => {
      const { service } = setup([contact({ ...marie, nextFollowUp: "2026-11-25" })]);
      await service.scheduleFollowUp("1", "2026-12-02");
      expect((await service.getContact("1"))?.nextFollowUp).toBe("2026-12-02");
    });

    it("accepte une relance aujourd'hui", async () => {
      const { service } = setup([marie]);
      const result = await service.scheduleFollowUp("1", TODAY);
      expect(result.ok).toBe(true);
    });

    it.each(["2026-11-20", "2025-11-25"])(
      "refuse la date passée %s sans rien enregistrer",
      async (date) => {
        const { service, writes } = setup([marie]);
        const result = await service.scheduleFollowUp("1", date);
        expect(result).toEqual({
          ok: false,
          error: "La date de relance ne peut pas être dans le passé.",
        });
        expect(writes()).toBe(0);
      },
    );

    it.each(["", "25/11/2026", "2026-02-30", "2026-13-01", "demain"])(
      "refuse la date invalide « %s »",
      async (date) => {
        const { service, writes } = setup([marie]);
        const result = await service.scheduleFollowUp("1", date);
        expect(result).toEqual({ ok: false, error: "La date n'est pas valide." });
        expect(writes()).toBe(0);
      },
    );

    it.each(["gagne", "perdu"] as const)(
      "refuse de planifier une relance pour un contact clos (« %s »)",
      async (stage) => {
        const { service, writes } = setup([contact({ ...marie, stage })]);
        const result = await service.scheduleFollowUp("1", "2026-11-25");
        expect(result).toEqual({
          ok: false,
          error: "Un contact clos ne peut pas avoir de relance.",
        });
        expect(writes()).toBe(0);
      },
    );

    it("refuse un contact inconnu", async () => {
      const { service, writes } = setup([marie]);
      const result = await service.scheduleFollowUp("inconnu", "2026-11-25");
      expect(result).toEqual({ ok: false, error: "Contact introuvable." });
      expect(writes()).toBe(0);
    });
  });

  describe("clearFollowUp", () => {
    it("supprime la relance du contact", async () => {
      const { service } = setup([contact({ ...marie, nextFollowUp: "2026-11-25" })]);
      const result = await service.clearFollowUp("1");
      expect(result).toEqual({ ok: true, contact: marie });
      expect((await service.getContact("1"))?.nextFollowUp).toBeNull();
    });

    it("refuse un contact inconnu", async () => {
      const { service, writes } = setup([marie]);
      const result = await service.clearFollowUp("inconnu");
      expect(result).toEqual({ ok: false, error: "Contact introuvable." });
      expect(writes()).toBe(0);
    });
  });

  describe("listDueFollowUps", () => {
    const aujourdhui = contact({ id: "1", name: "Aujourd'hui", nextFollowUp: TODAY });
    const hier = contact({ id: "2", name: "Hier", nextFollowUp: "2026-11-20" });
    const avantHier = contact({ id: "3", name: "Avant-hier", nextFollowUp: "2026-11-19" });
    const demain = contact({ id: "4", name: "Demain", nextFollowUp: "2026-11-22" });

    it("inclut un contact dont la relance est prévue aujourd'hui", async () => {
      const { service } = setup([aujourdhui]);
      expect(await service.listDueFollowUps()).toEqual([
        { contact: aujourdhui, overdue: false },
      ]);
    });

    it("inclut un contact dont la relance était prévue hier, marqué en retard", async () => {
      const { service } = setup([hier]);
      expect(await service.listDueFollowUps()).toEqual([{ contact: hier, overdue: true }]);
    });

    it("exclut un contact dont la relance est prévue demain", async () => {
      const { service } = setup([demain]);
      expect(await service.listDueFollowUps()).toEqual([]);
    });

    it("exclut un contact sans relance", async () => {
      const { service } = setup([marie]);
      expect(await service.listDueFollowUps()).toEqual([]);
    });

    it("renvoie une liste vide quand aucune relance n'est due", async () => {
      const { service } = setup();
      expect(await service.listDueFollowUps()).toEqual([]);
    });

    it("place d'abord les relances du jour, puis les retards du plus ancien au plus récent", async () => {
      const { service } = setup([hier, demain, aujourdhui, avantHier]);
      const due = await service.listDueFollowUps();
      expect(due.map((d) => [d.contact.name, d.overdue])).toEqual([
        ["Aujourd'hui", false],
        ["Avant-hier", true],
        ["Hier", true],
      ]);
    });

    it("exclut un contact clos", async () => {
      const { service } = setup([contact({ ...aujourdhui, stage: "gagne" })]);
      expect(await service.listDueFollowUps()).toEqual([]);
    });
  });
});
