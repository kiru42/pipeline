import { connection } from "next/server";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddContactForm } from "@/components/contacts/add-contact-form";
import { ContactList } from "@/components/contacts/contact-list";
import { getContactService } from "@/services/container";
import { addContactAction } from "../actions";

async function Contacts() {
  // Les contacts changent à chaque ajout : lecture à la requête, jamais au build.
  await connection();
  const service = await getContactService();
  const contacts = await service.listContacts();
  return <ContactList contacts={contacts} />;
}

export default function ContactsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-wrap items-start gap-8 px-4 py-10 md:px-8">
      <div className="min-w-0 flex-[999_1_32rem]">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
          <Contacts />
        </Suspense>
      </div>
      <Card className="min-w-0 flex-[1_1_18rem]">
        <CardHeader>
          <CardTitle>
            <h2 className="text-base font-semibold">Ajouter un contact</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AddContactForm action={addContactAction} />
        </CardContent>
      </Card>
    </div>
  );
}
