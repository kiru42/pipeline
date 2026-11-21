import { createLibsqlContactRepository } from "@/data/contact.repository";
import { getDb } from "@/data/db";
import { createContactService, type ContactService } from "./contact.service";

/** Point de composition : instancie les vrais repositories pour la présentation. */
export async function getContactService(): Promise<ContactService> {
  const repository = createLibsqlContactRepository(await getDb());
  return createContactService(repository, {
    generateId: () => crypto.randomUUID(),
  });
}
