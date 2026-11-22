import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { formatDay } from "@/lib/dates";
import type { DueFollowUp } from "@/services/contact.service";
import { getStage } from "@/services/stages";
import {
  CompleteFollowUpForm,
  type CompleteFollowUpState,
} from "./complete-follow-up-form";

type Props = {
  followUps: DueFollowUp[];
  /** Marque faite la relance du contact `id`, avec une nouvelle date facultative (`nextDate`). */
  complete: (
    id: string,
    state: CompleteFollowUpState,
    formData: FormData,
  ) => Promise<CompleteFollowUpState>;
};

export function DueFollowUps({ followUps, complete }: Props) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="due-follow-ups-title">
      <h2 id="due-follow-ups-title" className="text-lg font-semibold tracking-tight text-foreground">
        Relances du jour
      </h2>
      {followUps.length === 0 ? (
        <Empty className="border border-border bg-card">
          <EmptyHeader>
            <EmptyDescription>Rien à faire aujourd&apos;hui.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-2">
          {followUps.map(({ contact, overdue }) => (
            <li
              key={contact.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-highlight px-4 py-3 text-sm text-highlight-foreground"
            >
              <Link
                href={`/contacts/${contact.id}`}
                className="font-semibold underline-offset-4 hover:underline"
              >
                {contact.name}
              </Link>
              {overdue && contact.nextFollowUp ? (
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="border-transparent bg-card text-destructive">
                    en retard
                  </Badge>
                  <span className="tabular-nums">prévue le {formatDay(contact.nextFollowUp)}</span>
                </span>
              ) : (
                <span>
                  {[getStage(contact.stage).label, contact.company].filter(Boolean).join(" · ")}
                </span>
              )}
              <div className="ml-auto">
                <CompleteFollowUpForm
                  contactId={contact.id}
                  action={complete.bind(null, contact.id)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
