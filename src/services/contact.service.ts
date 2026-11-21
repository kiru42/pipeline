import type { Contact, ContactRepository } from "@/data/contact.repository";
import { isStage } from "./stages";

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

type Dependencies = { generateId: () => string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function optional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function createContactService(
  repository: ContactRepository,
  { generateId }: Dependencies,
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
      const contact: Contact = { ...existing, stage };
      await repository.update(contact);
      return { ok: true, contact };
    },
  };
}

export type ContactService = ReturnType<typeof createContactService>;
