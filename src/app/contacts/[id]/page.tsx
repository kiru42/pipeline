import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ContactDetails } from "@/components/contacts/contact-details";
import { ContactForm } from "@/components/contacts/contact-form";
import { StageSelector } from "@/components/contacts/stage-selector";
import { getContactService } from "@/services/container";
import { changeStageAction, updateContactAction } from "../../actions";

async function ContactSheet({ params }: Pick<PageProps<"/contacts/[id]">, "params">) {
  const { id } = await params;
  // La fiche change à chaque enregistrement : lecture à la requête, jamais mise en cache (ISR).
  await connection();
  const service = await getContactService();
  const contact = await service.getContact(id);
  if (!contact) notFound();

  return (
    <>
      <ContactDetails contact={contact} />
      <StageSelector
        key={contact.stage}
        stage={contact.stage}
        action={changeStageAction.bind(null, contact.id)}
      />
      <ContactForm contact={contact} action={updateContactAction.bind(null, contact.id)} />
    </>
  );
}

export default function ContactPage({ params }: PageProps<"/contacts/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12">
      <Link
        href="/"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Contacts
      </Link>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}
      >
        <ContactSheet params={params} />
      </Suspense>
    </main>
  );
}
