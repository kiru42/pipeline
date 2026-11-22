import { describe, expect, it } from "vitest";
import type { Contact, ContactRepository } from "@/data/contact.repository";
import { createContactService, type ContactDetailsInput } from "./contact.service";

function contact(overrides: Partial<Contact> & Pick<Contact, "id" | "name">): Contact {
  return {
    company: null,
    email: null,
    phone: null,
    note: null,
    stage: "premier-contact",
    nextFollowUp: null,
    lastContactedAt: null,
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

    it("place le nouveau contact à l'étape « Premier contact »", async () => {
      const { service } = setup();
      await service.addContact("Marie Dupont");
      expect((await service.listContacts())[0].stage).toBe("premier-contact");
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
    it("fait passer un contact « Échange » à « Proposition », dans la fiche et la liste", async () => {
      const { service } = setup([contact({ ...marie, stage: "echange" })]);
      const result = await service.changeStage("1", "proposition");
      const expected = contact({ ...marie, stage: "proposition" });
      expect(result).toEqual({ ok: true, contact: expected });
      expect(await service.getContact("1")).toEqual(expected);
      expect(await service.listContacts()).toEqual([expected]);
    });

    it.each([
      ["premier-contact", "echange"],
      ["echange", "proposition"],
      ["proposition", "negociation"],
      ["negociation", "signe"],
    ] as const)("accepte le passage de « %s » à l'étape suivante « %s »", async (from, to) => {
      const { service } = setup([contact({ ...marie, stage: from })]);
      const result = await service.changeStage("1", to);
      expect(result.ok).toBe(true);
      expect((await service.getContact("1"))?.stage).toBe(to);
    });

    it.each(["premier-contact", "echange", "proposition", "negociation"] as const)(
      "accepte le passage de « %s » à « Perdu »",
      async (from) => {
        const { service } = setup([contact({ ...marie, stage: from })]);
        const result = await service.changeStage("1", "perdu");
        expect(result.ok).toBe(true);
        expect((await service.getContact("1"))?.stage).toBe("perdu");
      },
    );

    it.each([
      ["echange", "negociation"],
      ["echange", "signe"],
      ["premier-contact", "proposition"],
    ] as const)("refuse un saut d'étape de « %s » à « %s » sans rien enregistrer", async (from, to) => {
      const { service, writes } = setup([contact({ ...marie, stage: from })]);
      const result = await service.changeStage("1", to);
      expect(result).toEqual({
        ok: false,
        error: "Un contact ne peut passer qu'à l'étape suivante ou à « Perdu ».",
      });
      expect(writes()).toBe(0);
    });

    it.each([
      ["echange", "premier-contact"],
      ["negociation", "proposition"],
      ["echange", "echange"],
    ] as const)("refuse un retour de « %s » à « %s » sans rien enregistrer", async (from, to) => {
      const { service, writes } = setup([contact({ ...marie, stage: from })]);
      const result = await service.changeStage("1", to);
      expect(result).toEqual({
        ok: false,
        error: "Un contact ne peut passer qu'à l'étape suivante ou à « Perdu ».",
      });
      expect(writes()).toBe(0);
    });

    it.each([
      ["signe", "perdu"],
      ["signe", "negociation"],
      ["perdu", "premier-contact"],
      ["perdu", "echange"],
    ] as const)("refuse de changer l'étape d'un contact clos « %s » (vers « %s »)", async (from, to) => {
      const { service, writes } = setup([contact({ ...marie, stage: from })]);
      const result = await service.changeStage("1", to);
      expect(result).toEqual({
        ok: false,
        error: "Un contact signé ou perdu ne change plus d'étape.",
      });
      expect(writes()).toBe(0);
    });

    it("ne modifie pas les autres informations du contact", async () => {
      const complete = contact({ ...marie, company: "Acme", email: "marie@acme.fr" });
      const { service } = setup([complete]);
      await service.changeStage("1", "echange");
      expect(await service.getContact("1")).toEqual({ ...complete, stage: "echange" });
    });

    it.each([
      ["negociation", "signe"],
      ["echange", "perdu"],
    ] as const)(
      "supprime la relance d'un contact « %s » qui passe à l'étape close « %s »",
      async (from, to) => {
        const { service } = setup([
          contact({ ...marie, stage: from, nextFollowUp: "2026-11-25" }),
        ]);
        await service.changeStage("1", to);
        expect((await service.getContact("1"))?.nextFollowUp).toBeNull();
      },
    );

    it("conserve la relance d'un contact qui reste ouvert", async () => {
      const { service } = setup([contact({ ...marie, nextFollowUp: "2026-11-25" })]);
      await service.changeStage("1", "echange");
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
      const result = await service.changeStage("inconnu", "echange");
      expect(result).toEqual({ ok: false, error: "Contact introuvable." });
      expect(writes()).toBe(0);
    });
  });

  describe("getPipeline", () => {
    it("renvoie les six colonnes dans l'ordre du pipeline, même vides", async () => {
      const { service } = setup();
      const pipeline = await service.getPipeline();
      expect(pipeline.columns.map((column) => [column.stage.label, column.count])).toEqual([
        ["Premier contact", 0],
        ["Échange", 0],
        ["Proposition", 0],
        ["Négociation", 0],
        ["Signé", 0],
        ["Perdu", 0],
      ]);
      expect(pipeline.inProgress).toBe(0);
    });

    it("range chaque contact dans la colonne de son étape, avec le nombre de contacts de chacune", async () => {
      const { service } = setup([
        contact({ id: "1", name: "A", stage: "echange" }),
        contact({ id: "2", name: "B", stage: "proposition" }),
        contact({ id: "3", name: "C", stage: "echange" }),
        contact({ id: "4", name: "D", stage: "signe" }),
      ]);
      const pipeline = await service.getPipeline();
      expect(
        pipeline.columns.map((column) => [
          column.stage.id,
          column.count,
          column.cards.map((card) => card.contact.name),
        ]),
      ).toEqual([
        ["premier-contact", 0, []],
        ["echange", 2, ["A", "C"]],
        ["proposition", 1, ["B"]],
        ["negociation", 0, []],
        ["signe", 1, ["D"]],
        ["perdu", 0, []],
      ]);
    });

    it("compte les contacts en cours, hors « Signé » et « Perdu »", async () => {
      const { service } = setup([
        contact({ id: "1", name: "A", stage: "premier-contact" }),
        contact({ id: "2", name: "B", stage: "negociation" }),
        contact({ id: "3", name: "C", stage: "signe" }),
        contact({ id: "4", name: "D", stage: "perdu" }),
      ]);
      expect((await service.getPipeline()).inProgress).toBe(2);
    });

    it("donne l'échéance de la relance en jours depuis aujourd'hui", async () => {
      const { service } = setup([
        contact({ id: "1", name: "Sans relance" }),
        contact({ id: "2", name: "Aujourd'hui", nextFollowUp: TODAY }),
        contact({ id: "3", name: "Demain", nextFollowUp: "2026-11-22" }),
        contact({ id: "4", name: "Dans 7 jours", nextFollowUp: "2026-11-28" }),
        contact({ id: "5", name: "Mois suivant", nextFollowUp: "2026-12-01" }),
        contact({ id: "6", name: "En retard", nextFollowUp: "2026-11-19" }),
      ]);
      const cards = (await service.getPipeline()).columns[0].cards;
      expect(cards.map((card) => [card.contact.name, card.followUpInDays])).toEqual([
        ["Sans relance", null],
        ["Aujourd'hui", 0],
        ["Demain", 1],
        ["Dans 7 jours", 7],
        ["Mois suivant", 10],
        ["En retard", -2],
      ]);
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

    it.each(["signe", "perdu"] as const)(
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
      const { service } = setup([contact({ ...aujourdhui, stage: "signe" })]);
      expect(await service.listDueFollowUps()).toEqual([]);
    });
  });

  describe("completeFollowUp", () => {
    const due = contact({ ...marie, stage: "echange", nextFollowUp: TODAY });

    it("marque la relance faite et replanifie à la nouvelle date : le contact sort des relances du jour", async () => {
      const { service } = setup([due]);
      const result = await service.completeFollowUp("1", "2026-11-28");
      const expected = { ...due, nextFollowUp: "2026-11-28", lastContactedAt: TODAY };
      expect(result).toEqual({ ok: true, contact: expected });
      expect(await service.listDueFollowUps()).toEqual([]);
      expect(await service.getContact("1")).toEqual(expected);
    });

    it.each(["", "   "])(
      "marque la relance faite sans nouvelle date (« %s ») : plus de relance",
      async (nextDate) => {
        const { service } = setup([due]);
        const result = await service.completeFollowUp("1", nextDate);
        expect(result).toEqual({
          ok: true,
          contact: { ...due, nextFollowUp: null, lastContactedAt: TODAY },
        });
        expect(await service.listDueFollowUps()).toEqual([]);
      },
    );

    it("traite aussi une relance en retard", async () => {
      const { service } = setup([contact({ ...due, nextFollowUp: "2026-11-18" })]);
      const result = await service.completeFollowUp("1", "");
      expect(result.ok).toBe(true);
      expect(await service.listDueFollowUps()).toEqual([]);
    });

    it.each([TODAY, "2026-11-20"])(
      "refuse une nouvelle date qui n'est pas postérieure à aujourd'hui (%s)",
      async (nextDate) => {
        const { service, writes } = setup([due]);
        const result = await service.completeFollowUp("1", nextDate);
        expect(result).toEqual({
          ok: false,
          error: "La nouvelle relance doit être postérieure à aujourd'hui.",
        });
        expect(writes()).toBe(0);
      },
    );

    it("refuse une nouvelle date invalide", async () => {
      const { service, writes } = setup([due]);
      const result = await service.completeFollowUp("1", "2026-02-30");
      expect(result).toEqual({ ok: false, error: "La date n'est pas valide." });
      expect(writes()).toBe(0);
    });

    it.each([
      ["sans relance", null],
      ["dont la relance est à venir", "2026-11-22"],
    ])("refuse de traiter un contact %s", async (_label, nextFollowUp) => {
      const { service, writes } = setup([contact({ ...due, nextFollowUp })]);
      const result = await service.completeFollowUp("1", "");
      expect(result).toEqual({ ok: false, error: "Aucune relance due pour ce contact." });
      expect(writes()).toBe(0);
    });

    it("refuse un contact inconnu", async () => {
      const { service, writes } = setup([due]);
      const result = await service.completeFollowUp("inconnu", "");
      expect(result).toEqual({ ok: false, error: "Contact introuvable." });
      expect(writes()).toBe(0);
    });
  });
});
