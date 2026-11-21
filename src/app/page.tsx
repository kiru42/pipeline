import { connection } from "next/server";
import { Suspense } from "react";
import { AddContactForm } from "@/components/contacts/add-contact-form";
import { ContactList } from "@/components/contacts/contact-list";
import { DueFollowUps } from "@/components/contacts/due-follow-ups";
import { getContactService } from "@/services/container";
import { addContactAction } from "./actions";

function Loading() {
  return <p className="text-sm text-muted-foreground">Chargement…</p>;
}

async function TodayFollowUps() {
  // Dépend de la date du jour et des relances : lecture à la requête, jamais au build.
  await connection();
  const service = await getContactService();
  const followUps = await service.listDueFollowUps();
  return <DueFollowUps followUps={followUps} />;
}

async function Contacts() {
  // Les contacts changent à chaque ajout : lecture à la requête, jamais au build.
  await connection();
  const service = await getContactService();
  const contacts = await service.listContacts();
  return <ContactList contacts={contacts} />;
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">Pipeline</h1>
      <Suspense fallback={<Loading />}>
        <TodayFollowUps />
      </Suspense>
      <section className="flex flex-col gap-4" aria-labelledby="contacts-title">
        <h2 id="contacts-title" className="text-lg font-semibold text-foreground">
          Contacts
        </h2>
        <AddContactForm action={addContactAction} />
        <Suspense fallback={<Loading />}>
          <Contacts />
        </Suspense>
      </section>
    </main>
  );
}
