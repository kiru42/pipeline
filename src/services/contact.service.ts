import type { Contact, ContactRepository } from "@/data/contact.repository";
import { isClosedStage, isStage } from "./stages";

export type { Contact };
export type { Stage, StageInfo } from "./stages";

export type AddContactResult =
  | { ok: true; contact: Contact }
  | { ok: false; error: string };

/** Valeurs saisies dans la fiche, telles que reçues du formulaire. */
export type ContactDetailsInput = {
  company: string;
  email: string;
  phone: string;
  note: string;
};

export type UpdateContactResult =
  | { ok: true; contact: Contact }
  | { ok: false; errors: { email: string } }
  | { ok: false; error: string };

export type ChangeStageResult =
  | { ok: true; contact: Contact }
  | { ok: false; error: string };

export type FollowUpResult =
  | { ok: true; contact: Contact }
  | { ok: false; error: string };

type Dependencies = {
  generateId: () => string;
  /** Date du jour, au format AAAA-MM-JJ. */
  today: () => string;
};

const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Vrai pour une date AAAA-MM-JJ qui existe au calendrier. */
function isValidDay(value: string): boolean {
  const match = DAY_PATTERN.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function optional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function createContactService(
  repository: ContactRepository,
  { generateId, today }: Dependencies,
) {
  return {
    listContacts(): Promise<Contact[]> {
      return repository.list();
    },

    getContact(id: string): Promise<Contact | null> {
      return repository.findById(id);
    },

    async addContact(name: string): Promise<AddContactResult> {
      const trimmed = name.trim();
      if (trimmed === "") {
        return { ok: false, error: "Le nom est obligatoire." };
      }
      const contact: Contact = {
        id: generateId(),
        name: trimmed,
        company: null,
        email: null,
        phone: null,
        note: null,
        stage: "nouveau",
        nextFollowUp: null,
      };
      await repository.create(contact);
      return { ok: true, contact };
    },

    async updateContact(
      id: string,
      input: ContactDetailsInput,
    ): Promise<UpdateContactResult> {
      const email = optional(input.email);
      if (email !== null && !EMAIL_PATTERN.test(email)) {
        return { ok: false, errors: { email: "L'email n'est pas valide." } };
      }

      const existing = await repository.findById(id);
      if (!existing) {
        return { ok: false, error: "Contact introuvable." };
      }

      const contact: Contact = {
        ...existing,
        company: optional(input.company),
        email,
        phone: optional(input.phone),
        note: optional(input.note),
      };
      await repository.update(contact);
      return { ok: true, contact };
    },

    async changeStage(id: string, stage: string): Promise<ChangeStageResult> {
      if (!isStage(stage)) {
        return { ok: false, error: "Étape inconnue." };
      }
      const existing = await repository.findById(id);
      if (!existing) {
        return { ok: false, error: "Contact introuvable." };
      }
      const contact: Contact = {
        ...existing,
        stage,
        // Un contact clos n'a plus de relance.
        nextFollowUp: isClosedStage(stage) ? null : existing.nextFollowUp,
      };
      await repository.update(contact);
      return { ok: true, contact };
    },

    async scheduleFollowUp(id: string, date: string): Promise<FollowUpResult> {
      if (!isValidDay(date)) {
        return { ok: false, error: "La date n'est pas valide." };
      }
      if (date < today()) {
        return { ok: false, error: "La date de relance ne peut pas être dans le passé." };
      }
      const existing = await repository.findById(id);
      if (!existing) {
        return { ok: false, error: "Contact introuvable." };
      }
      if (isClosedStage(existing.stage)) {
        return { ok: false, error: "Un contact clos ne peut pas avoir de relance." };
      }
      const contact: Contact = { ...existing, nextFollowUp: date };
      await repository.update(contact);
      return { ok: true, contact };
    },

    async clearFollowUp(id: string): Promise<FollowUpResult> {
      const existing = await repository.findById(id);
      if (!existing) {
        return { ok: false, error: "Contact introuvable." };
      }
      const contact: Contact = { ...existing, nextFollowUp: null };
      await repository.update(contact);
      return { ok: true, contact };
    },
  };
}

export type ContactService = ReturnType<typeof createContactService>;
