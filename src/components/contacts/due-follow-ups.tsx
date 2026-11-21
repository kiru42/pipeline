import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { formatDay } from "@/lib/dates";
import type { DueFollowUp } from "@/services/contact.service";

export function DueFollowUps({ followUps }: { followUps: DueFollowUp[] }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="due-follow-ups-title">
      <h2 id="due-follow-ups-title" className="text-lg font-semibold text-foreground">
        Relances du jour
      </h2>
      {followUps.length === 0 ? (
        <Empty className="border border-border">
          <EmptyHeader>
            <EmptyDescription>Rien à faire aujourd&apos;hui.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-2">
          {followUps.map(({ contact, overdue }) => (
            <li
              key={contact.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-highlight px-4 py-3 text-sm text-highlight-foreground"
            >
              <Link
                href={`/contacts/${contact.id}`}
                className="font-medium underline-offset-4 hover:underline"
              >
                {contact.name}
              </Link>
              {overdue && contact.nextFollowUp && (
                <span className="flex items-center gap-2">
                  <Badge variant="destructive">en retard</Badge>
                  <span>prévue le {formatDay(contact.nextFollowUp)}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
