import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ContactCoordinates } from "@/components/contacts/contact-coordinates";
import { ContactDetails } from "@/components/contacts/contact-details";
import { FollowUpForm } from "@/components/contacts/follow-up-form";
import { StageSelector } from "@/components/contacts/stage-selector";
import { getContactService } from "@/services/container";
import { allowedNextStages } from "@/services/stages";
import {
  changeStageAction,
  clearFollowUpAction,
  scheduleFollowUpAction,
  updateContactAction,
} from "../../actions";

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
        allowed={allowedNextStages(contact.stage)}
        action={changeStageAction.bind(null, contact.id)}
      />
      <div className="flex flex-wrap items-start gap-6">
        <div className="min-w-0 flex-[999_1_32rem]">
          <ContactCoordinates
            key={JSON.stringify([contact.company, contact.email, contact.phone, contact.note])}
            contact={contact}
            action={updateContactAction.bind(null, contact.id)}
          />
        </div>
        <Card className="min-w-0 flex-[1_1_18rem]">
          <CardContent>
            <FollowUpForm
              key={`${contact.stage}:${contact.nextFollowUp}`}
              contact={contact}
              schedule={scheduleFollowUpAction.bind(null, contact.id)}
              clear={clearFollowUpAction.bind(null, contact.id)}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function ContactPage({ params }: PageProps<"/contacts/[id]">) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-7 px-4 py-8 md:px-8">
      <Link
        href="/contacts"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Retour
      </Link>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
        <ContactSheet params={params} />
      </Suspense>
    </div>
  );
}
