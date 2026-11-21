import { createLibsqlContactRepository } from "@/data/contact.repository";
import { getDb } from "@/data/db";
import { createContactService, type ContactService } from "./contact.service";

/** Fuseau de l'utilisateur : la « date du jour » des relances ne dépend pas du fuseau du serveur (UTC sur Vercel). */
const TIME_ZONE = "Europe/Paris";

/** Date du jour au format AAAA-MM-JJ dans le fuseau de l'utilisateur. */
function today(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Point de composition : instancie les vrais repositories pour la présentation. */
export async function getContactService(): Promise<ContactService> {
  const repository = createLibsqlContactRepository(await getDb());
  return createContactService(repository, {
    generateId: () => crypto.randomUUID(),
    today,
  });
}
