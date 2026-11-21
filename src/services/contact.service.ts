import type { Contact, ContactRepository } from "@/data/contact.repository";

export type { Contact };

export type AddContactResult =
  | { ok: true; contact: Contact }
  | { ok: false; error: string };

type Dependencies = { generateId: () => string };

export function createContactService(
  repository: ContactRepository,
  { generateId }: Dependencies,
) {
  return {
    listContacts(): Promise<Contact[]> {
      return repository.list();
    },

    async addContact(name: string): Promise<AddContactResult> {
      const trimmed = name.trim();
      if (trimmed === "") {
        return { ok: false, error: "Le nom est obligatoire." };
      }
      const contact = { id: generateId(), name: trimmed };
      await repository.create(contact);
      return { ok: true, contact };
    },
  };
}

export type ContactService = ReturnType<typeof createContactService>;
