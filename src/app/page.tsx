import { connection } from "next/server";
import { Suspense } from "react";
import { AddContactForm } from "@/components/contacts/add-contact-form";
import { ContactList } from "@/components/contacts/contact-list";
import { getContactService } from "@/services/container";
import { addContactAction } from "./actions";

async function Contacts() {
  // Les contacts changent à chaque ajout : lecture à la requête, jamais au build.
  await connection();
  const service = await getContactService();
  const contacts = await service.listContacts();
  return <ContactList contacts={contacts} />;
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">Contacts</h1>
      <AddContactForm action={addContactAction} />
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}
      >
        <Contacts />
      </Suspense>
    </main>
  );
}
